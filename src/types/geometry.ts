export type DesignSpeed = 40 | 50 | 60 | 70 | 80 | 90 | 100 | 110 | 120 | 130

export type Standard = 'austroads' | 'mainroads_wa'

/** Vehicle types for SSD and K-value computation */
export type VehicleType = 'LME' | 'HME' | 'RAV4S' | 'Truck'

/** Road surface type — determines applicable standards and vehicle types */
export type RoadSurface = 'sealed' | 'unsealed'

export type CheckStatus = 'pass' | 'fail' | 'warning' | 'info'

export type CheckCategory =
  | 'Horizontal Alignment'
  | 'Vertical Alignment'
  | 'Superelevation'
  | 'Chainages'

export interface HorizontalIP {
  id: string
  chainage: number
  deflectionAngle: number   // decimal degrees, positive = right, negative = left
  deflectionDirection: 'L' | 'R'
  radius: number            // metres, 0 = tangent point
  arcLength: number         // metres
  tangentLength: number     // metres
  transitionLengthIn: number
  transitionLengthOut: number
  clothoidParameter?: number // A value
}

export interface VerticalIP {
  id: string
  chainage: number
  level: number             // mAHD
  gradeIn: number           // %, positive = rising
  gradeOut: number          // %, positive = rising
  gradeChange: number       // |gradeOut - gradeIn| %
  kValue: number
  vcLength: number          // metres
  vcType: 'crest' | 'sag' | 'none'
}

export interface GradeSection {
  fromChainage: number
  toChainage: number
  grade: number             // %
}

export interface SuperelevationPoint {
  chainage: number
  leftRate: number          // %, positive = normal (high side)
  rightRate: number         // %, positive = normal (high side)
}

export interface AlignmentData {
  name: string
  designSpeed?: DesignSpeed
  horizontalIPs: HorizontalIP[]
  verticalIPs: VerticalIP[]
  gradeSections: GradeSection[]
  superelevation: SuperelevationPoint[]
  startChainage: number
  endChainage: number
  parseWarnings: string[]
}

export interface CheckResult {
  id: string
  category: CheckCategory
  element: string           // e.g. "IP 3" or "VIP 7"
  check: string             // description of the check
  value: string             // actual value
  limit: string             // required limit
  status: CheckStatus
  clause: string            // standard reference
  notes?: string
}
