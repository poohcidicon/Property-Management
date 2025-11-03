export interface UnitMatrix {
  UnitID: string;
  UnitNumber: string;
  UnitStatus: number;
  X: number;
  Y: number;
  M_Price: number;
  D_Price: number;
  floor: string;
}

export interface FloorPlan {
  ProjectID: string;
  FloorPlanID: string;
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

export interface ProductGroupMaster {
  ID: string;
  Name: string;
  NameEng: string;
  Value: number;
  Groups: string;
  isDelete: number;
  Sequence: number;
  UpdatedBy: string;
  UpdatedDate: string;
}