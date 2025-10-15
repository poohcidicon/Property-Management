import { Request } from 'mssql'

export interface SysConfRunFormat {
  RunFormatID: number;
  RunKey: string;
  Format: string;
  ProjectID: string; // may contain CompanyID in some edge cases per original code
  SBUID: string;
  CompanyID: string;
  isContinues: boolean | number | null;
}
export interface IPayloadGenRunNumberHotel {
  runKey: string,
  projectID: string | null | undefined,
  sbuid: string | null | undefined,
  runningDate: Date,
  userID: string,
  fixWord: string,
}

export const getRunNumberHotel = async (
  payload: IPayloadGenRunNumberHotel,
  pool: Request
): Promise<string | null> => {
  try{
    const { projectID: ProjectID, sbuid: SBUID, runKey, runningDate, fixWord } = payload
    const confSql = `
      SELECT *
      FROM Sys_Conf_RunFormat
      WHERE ISNULL(isActive,0)=1 AND RunKey = @runKey;
    `;
    pool.input("runKey", payload.runKey);
    const { recordset: confList } = await pool.query<SysConfRunFormat>(confSql);
    delete pool.parameters["runKey"]

    let runFormat: SysConfRunFormat | undefined;
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
      const projectRowQuery = `SELECT CompanyID FROM Sys_Master_Projects WHERE ProjectID = @ProjectID;`
      const { recordset: projRows } = await pool.input("ProjectID", ProjectID).query<SysConfRunFormat>(projectRowQuery);
      delete pool.parameters["ProjectID"]
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

      const EXEC = `
        EXEC SP_REM_GENRUNNING @pjSb, @comp, @rkey, @rdate, @rtype, @isCont, 'System'
      `
      pool.input('pjSb', (runFormat.ProjectID ?? "") + (runFormat.SBUID ?? ""))
      pool.input('comp', runFormat.CompanyID ?? "")
      pool.input('rkey', runFormat.RunKey ?? runKey)
      pool.input('rdate', fmtDate(runningDate, "yyyy-MM-dd"))
      pool.input('rtype', Number(rType))
      pool.input('isCont', truthy(runFormat.isContinues) ? 1 : 0)

      const { recordset: [runningScalar] } = await pool.query(EXEC);

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
    }
    return null
  }
  catch (e) {
    console.log(e)
    return null
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