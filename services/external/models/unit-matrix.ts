export interface UnitMatrix {
  UnitID: string;
  UnitNumber: string;
  UnitStatus: number;
  X: number;
  Y: number;
  M_Price: number;
  D_Price: number;
}

export interface FloorPlan {
  ProjectID: string;
  FloorPlanName: string;
  X: number;
  Y: number;
  FloorPlanPath: string;
  FileID: string;
}

export interface CompensateUnit {
  CompUnitID: string;
  CompensateID: string;
  BookingID: string;
  UnitID: string;
  BookingDate: string;
  CompenDate: string;
}