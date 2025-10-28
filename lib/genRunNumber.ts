// genRunNumber.ts
// Ported from C# GenRunNumber(...) to Node.js TypeScript
// Source logic: Sys_Conf_RunFormat selection by priority, SP_REM_GENRUNNING call, token replacements
// Note: Parameter names and casing mirror the original for clarity.

export interface DbTransaction {} // placeholder for your driver

export interface DBHelper {
  // Execute a query that returns a scalar value
  executeScalar(sql: string, params?: Record<string, unknown>, trans?: DbTransaction): Promise<unknown>;
  // Execute a query that returns rows
  executeQuery<T = any>(sql: string, params?: Record<string, unknown>, trans?: DbTransaction): Promise<T[]>;
}

export interface SysConfRunFormat {
  RunFormatID: number;
  RunKey: string;
  Format: string;
  ProjectID: string; // may contain CompanyID in some edge cases per original code
  SBUID: string;
  CompanyID: string;
  isContinues: boolean | number | null;
}

export interface SysMasterProjects {
  CompanyID: string;
}

/**
 * Optional hook: the original code calls GenProjectRunformat when ProjectID is provided.
 * Implement if you need to materialize default run-format rows ahead of time.
 */
export type GenProjectRunformatHook = (
  db: DBHelper,
  trans: DbTransaction | undefined,
  projectID: string,
  userID: string
) => Promise<void>;

/**
 * Port of GenRunNumber from C# to TypeScript.
 */
export async function genRunNumber(
  db: DBHelper,
  trans: DbTransaction | undefined,
  runKey: string,
  projectID: string | null | undefined,
  sbuid: string | null | undefined,
  runningDate: Date,
  userID: string,
  fixWord: string,
  opts?: {
    genProjectRunformatHook?: GenProjectRunformatHook;
    // If your DB requires EXEC syntax differences, set this to true to use "EXEC SP_REM_GENRUNNING ..." form.
    useExecKeyword?: boolean;
  }
): Promise<string> {
  if (!runKey || runKey.trim() === "") {
    throw new Error("RunKey must has a value.");
  }

  const ProjectID = (projectID ?? "").trim();
  const SBUID = (sbuid ?? "").trim();

  // Mirror original behavior
  if (ProjectID && opts?.genProjectRunformatHook) {
    await opts.genProjectRunformatHook(db, trans, ProjectID, userID);
  }

  // Load run-format configurations
  const confSql = `
    SELECT *
    FROM Sys_Conf_RunFormat
    WHERE ISNULL(isActive,0)=1 AND RunKey = @runKey;
  `;
  const confList = (await db.executeQuery<SysConfRunFormat>(
    confSql,
    { runKey },
    trans
  )) as SysConfRunFormat[];

  let runFormat: SysConfRunFormat | undefined;

  // Selection priority (ported 1:1)
  runFormat = confList.find(
    (x) =>
      isEmpty(x.CompanyID) &&
      !isEmpty(x.ProjectID) &&
      !isEmpty(x.SBUID) &&
      eq(x.ProjectID, ProjectID) &&
      eq(x.SBUID, SBUID)
  );
  if (!runFormat) {
    runFormat = confList.find(
      (x) =>
        isEmpty(x.CompanyID) &&
        !isEmpty(x.ProjectID) &&
        eq(x.ProjectID, ProjectID) &&
        isEmpty(x.SBUID)
    );
  }
  if (!runFormat) {
    runFormat = confList.find(
      (x) => !isEmpty(x.SBUID) && isEmpty(x.ProjectID) && eq(x.SBUID, SBUID)
    );
  }
  if (!runFormat && isEmpty(ProjectID)) {
    runFormat = confList.find((x) => isEmpty(x.ProjectID) && isEmpty(x.SBUID));
  }

  if (!runFormat) {
    // Try via project -> company
    const projRows = await db.executeQuery<SysMasterProjects>(
      `SELECT CompanyID FROM Sys_Master_Projects WHERE ProjectID = @pid;`,
      { pid: ProjectID },
      trans
    );

    if (projRows.length > 0) {
      const companyID = projRows[0].CompanyID;
      runFormat = confList.find(
        (x) =>
          !isEmpty(x.CompanyID) &&
          !isEmpty(x.SBUID) &&
          x.ProjectID === companyID &&
          eq(x.SBUID, SBUID)
      );
      if (!runFormat) {
        runFormat = confList.find(
          (x) =>
            !isEmpty(x.CompanyID) &&
            x.ProjectID === companyID &&
            isEmpty(x.SBUID)
        );
      }
    } else {
      // Edge case per original comments: sometimes ProjectID actually carries CompanyID
      runFormat = confList.find(
        (x) =>
          !isEmpty(x.CompanyID) &&
          !isEmpty(x.SBUID) &&
          x.ProjectID === ProjectID &&
          x.CompanyID === ProjectID &&
          eq(x.SBUID, SBUID)
      );
      if (!runFormat) {
        runFormat = confList.find(
          (x) =>
            !isEmpty(x.CompanyID) &&
            x.ProjectID === ProjectID &&
            x.CompanyID === ProjectID &&
            isEmpty(x.SBUID)
        );
      }
    }
  }

  if (!runFormat) {
    runFormat = confList.find((x) => isEmpty(x.ProjectID) && isEmpty(x.SBUID));
  }

  if (!runFormat) {
    // final fallback
    runFormat = {
      RunFormatID: 0,
      Format: "",
      RunKey: "",
      ProjectID: "",
      SBUID: "",
      CompanyID: "",
      isContinues: false
    };
  }

  if (runFormat.RunFormatID !== 0 && !isEmpty(runFormat.Format)) {
    // Determine RType from pattern
    const fmt = runFormat.Format;
    const hasY = /\[(YYYY|YY|BBBB|BB)\]/.test(fmt);
    const hasYM = /\[(YYYYMM|YYMM|BBBBMM|BBMM)\]/.test(fmt);
    const hasYMD = /\[(YYYYMMDD|YYMMDD|BBBBMMDD|BBMMDD)\]/.test(fmt);

    let rType = "0";
    if (hasYMD) rType = "3";
    else if (hasYM) rType = "2";
    else if (hasY) rType = "1";

    const proc =
      (opts?.useExecKeyword ? "EXEC " : "") +
      `SP_REM_GENRUNNING @pjSb, @comp, @rkey, @rdate, @rtype, @isCont, 'System'`;

    const runningScalar = await db.executeScalar(
      proc,
      {
        pjSb: (runFormat.ProjectID ?? "") + (runFormat.SBUID ?? ""),
        comp: runFormat.CompanyID ?? "",
        rkey: runFormat.RunKey ?? runKey, // prefer row value; fallback to arg
        rdate: fmtDate(runningDate, "yyyy-MM-dd"),
        rtype: Number(rType),
        isCont: truthy(runFormat.isContinues) ? 1 : 0
      },
      trans
    );
    const running = String(runningScalar ?? "");
    if (!running) {
      throw new Error(
        "System can't genarate running because store procedure return null value."
      );
    }

    // Replace tokens
    let result = runFormat.Format;

    // Buddhist year handling (BB/BBBB) per original logic
    const bbDate =
      runningDate.getFullYear() < 2500
        ? addYears(runningDate, 543)
        : runningDate;

    // Date tokens
    result = replaceAll(result, "[YYYY]", fmtDate(runningDate, "yyyy"));
    result = replaceAll(result, "[YY]", fmtDate(runningDate, "yy"));
    result = replaceAll(result, "[BBBB]", fmtDate(bbDate, "yyyy"));
    result = replaceAll(result, "[BB]", fmtDate(bbDate, "yy"));
    result = replaceAll(result, "[YYYYMM]", fmtDate(runningDate, "yyyyMM"));
    result = replaceAll(result, "[YYMM]", fmtDate(runningDate, "yyMM"));
    result = replaceAll(result, "[MM]", fmtDate(runningDate, "MM"));
    result = replaceAll(result, "[BBBBMM]", fmtDate(bbDate, "yyyyMM"));
    result = replaceAll(result, "[BBMM]", fmtDate(bbDate, "yyMM"));
    result = replaceAll(result, "[YYYYMMDD]", fmtDate(runningDate, "yyyyMMdd"));
    result = replaceAll(result, "[YYMMDD]", fmtDate(runningDate, "yyMMdd"));
    result = replaceAll(result, "[BBBBMMDD]", fmtDate(bbDate, "yyyyMMdd"));
    result = replaceAll(result, "[BBMMDD]", fmtDate(bbDate, "yyMMdd"));

    // Fixed word token
    result = replaceAll(result, "[F]", fixWord ?? "");

    // Running-number token: find "[RRR...]" and pad 'running' to that length
    result = result.replace(/\[(R+)\]/g, (_m, rGroup: string) => {
      const runLen = rGroup.length;
      return running.padStart(runLen, "0");
    });

    return result;
  } else {
    throw new Error(`Can't find key name ${runKey} for running`);
  }
}

/* ------------------------ helpers ------------------------ */

function isEmpty(s?: string | null): boolean {
  return !s || s.trim() === "";
}
function eq(a?: string | null, b?: string | null): boolean {
  return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}
function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

function addYears(d: Date, years: number): Date {
  const nd = new Date(d.getTime());
  nd.setFullYear(d.getFullYear() + years);
  return nd;
}

function fmtDate(d: Date, pattern: "yyyy" | "yy" | "MM" | "yyyyMM" | "yyMM" | "yyyyMMdd" | "yyMMdd" | "yyyy-MM-dd"): string {
  const yyyy = String(d.getFullYear());
  const yy = yyyy.slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  switch (pattern) {
    case "yyyy": return yyyy;
    case "yy": return yy;
    case "MM": return MM;
    case "yyyyMM": return `${yyyy}${MM}`;
    case "yyMM": return `${yy}${MM}`;
    case "yyyyMMdd": return `${yyyy}${MM}${dd}`;
    case "yyMMdd": return `${yy}${MM}${dd}`;
    case "yyyy-MM-dd": return `${yyyy}-${MM}-${dd}`;
  }
}

function replaceAll(s: string, find: string, repl: string) {
  return s.split(find).join(repl);
}
