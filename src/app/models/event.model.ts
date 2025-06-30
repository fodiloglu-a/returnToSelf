export interface EventModel {
  id: number;
  title: string;
  description: string;
  shortDescription: string;
  date: string; // ISO string format
  time: string;
  location: string;
  imageUrl: string;
  price: number;
  capacity: number;
  registeredCount: number;
  category: EventCategory;
  tags: string[];
  instructor: string;
  duration: string;
  level: EventLevel;
  isActive: boolean;
  blogId:number

  // YENİ: Demografik Hedefleme
  targetAudience: TargetAudience;
  minAge?: number;
  maxAge?: number;
  genderSpecific?: GenderType;

  // YENİ: Terapötik Yaklaşımlar
  therapeuticMethods: TherapeuticMethod[];
  participationStyle: ParticipationStyle;
  requiresActiveParticipation: boolean;
  allowsObserverMode: boolean;

  // YENİ: Özel Özellikler
  includesDigitalDetox: boolean;
  individualSessionIncluded: boolean;
  accommodationOptions: AccommodationType[];
  specialPackages: SpecialPackage[];

  // YENİ: Sertifikasyon ve Kalite
  certifiedMethods: boolean;
  ethicalStandards: EthicalStandard[];
  instructorCertifications: string[];

  // YENİ: Hedef Grup Detayları
  targetProblems: TargetProblem[];
  expectedOutcomes: ExpectedOutcome[];
  prerequisites?: string[];
}

// YENİ ENUM'LAR

export enum TargetAudience {
  WOMEN_ONLY = 'women_only',
  MEN_ONLY = 'men_only',
  MIXED_GENDER = 'mixed_gender',
  COUPLES = 'couples',
  FAMILIES = 'families',
  PROFESSIONALS = 'professionals',
  STUDENTS = 'students',
  SENIORS = 'seniors'
}

export enum GenderType {
  FEMALE = 'female',
  MALE = 'male',
  NON_BINARY = 'non_binary',
  ALL_GENDERS = 'all_genders'
}

export enum TherapeuticMethod {
  PSYCHODRAMA = 'psychodrama',
  SYSTEMIC_FAMILY_THERAPY = 'systemic_family_therapy',
  METAPHORICAL_CARDS = 'metaphorical_cards',
  SYMBOL_DRAMA = 'symbol_drama',
  BODY_AWARENESS = 'body_awareness',
  GESTALT_THERAPY = 'gestalt_therapy',
  CBT = 'cbt',
  MINDFULNESS = 'mindfulness',
  MEDITATION = 'meditation',
  ART_THERAPY = 'art_therapy',
  MUSIC_THERAPY = 'music_therapy',
  DANCE_THERAPY = 'dance_therapy'
}

export enum ParticipationStyle {
  ACTIVE_REQUIRED = 'active_required',
  FLEXIBLE_PARTICIPATION = 'flexible_participation',
  OBSERVER_FRIENDLY = 'observer_friendly',
  SELF_PACED = 'self_paced',
  GROUP_INTERACTIVE = 'group_interactive'
}

export enum AccommodationType {
  SINGLE_ROOM = 'single_room',
  DOUBLE_ROOM = 'double_room',
  TRIPLE_ROOM = 'triple_room',
  SHARED_DORMITORY = 'shared_dormitory',
  LUXURY_SUITE = 'luxury_suite'
}

export enum SpecialPackage {
  BASIC_EXPERIENCE = 'basic_experience',
  PERSONAL_SUPPORT = 'personal_support',
  PREMIUM_SPACE = 'premium_space',
  DIGITAL_DETOX = 'digital_detox',
  THERAPEUTIC_INTENSIVE = 'therapeutic_intensive'
}

export enum EthicalStandard {
  CONFIDENTIALITY = 'confidentiality',
  INFORMED_CONSENT = 'informed_consent',
  PROFESSIONAL_BOUNDARIES = 'professional_boundaries',
  NON_JUDGMENT = 'non_judgment',
  CULTURAL_SENSITIVITY = 'cultural_sensitivity',
  TRAUMA_INFORMED = 'trauma_informed'
}

export enum TargetProblem {
  BURNOUT = 'burnout',
  ANXIETY = 'anxiety',
  DEPRESSION = 'depression',
  RELATIONSHIP_ISSUES = 'relationship_issues',
  IDENTITY_CRISIS = 'identity_crisis',
  WORK_LIFE_BALANCE = 'work_life_balance',
  SELF_ESTEEM = 'self_esteem',
  GRIEF_LOSS = 'grief_loss',
  TRAUMA = 'trauma',
  ADDICTION = 'addiction',
  FAMILY_DYNAMICS = 'family_dynamics',
  LIFE_TRANSITIONS = 'life_transitions',
  INNER_VOICE_LOSS = 'inner_voice_loss',
  SYSTEM_FATIGUE = 'system_fatigue'
}

export enum ExpectedOutcome {
  SELF_AWARENESS = 'self_awareness',
  EMOTIONAL_REGULATION = 'emotional_regulation',
  STRESS_REDUCTION = 'stress_reduction',
  INNER_PEACE = 'inner_peace',
  CLARITY = 'clarity',
  PERSONAL_GROWTH = 'personal_growth',
  HEALING = 'healing',
  CONNECTION = 'connection',
  EMPOWERMENT = 'empowerment',
  RENEWED_ENERGY = 'renewed_energy',
  LIFE_DIRECTION = 'life_direction',
  AUTHENTICITY = 'authenticity'
}

// YENİ: Güncellenmiş EventCategory
export enum EventCategory {
  RETREAT = 'retreat',
  WORKSHOP = 'workshop',
  SEMINAR = 'seminar',
  THERAPY = 'therapy',
  MINDFULNESS = 'mindfulness',
  // YENİ kategoriler
  WOMENS_RETREAT = 'womens_retreat',
  MENS_RETREAT = 'mens_retreat',
  COUPLES_RETREAT = 'couples_retreat',
  DIGITAL_DETOX = 'digital_detox',
  THERAPEUTIC_INTENSIVE = 'therapeutic_intensive',
  PSYCHODRAMA_WORKSHOP = 'psychodrama_workshop',
  FAMILY_CONSTELLATION = 'family_constellation'
}

// YENİ: Genişletilmiş EventLevel
export enum EventLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels',
  // YENİ seviyeler
  NO_EXPERIENCE_NEEDED = 'no_experience_needed',
  SOME_THERAPY_EXPERIENCE = 'some_therapy_experience',
  ADVANCED_PRACTITIONERS = 'advanced_practitioners',
  PROFESSIONALS_ONLY = 'professionals_only'
}
