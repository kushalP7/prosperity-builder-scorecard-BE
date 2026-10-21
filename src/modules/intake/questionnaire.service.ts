import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QuestionnaireSubmission, QuestionnaireStatus } from './entities/questionnaire-submission.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { PaymentsService } from '../payments/payments.service';
import { MilestoneType } from '../payments/entities/payment-milestone.entity';

export interface QuestionDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'textarea' | 'date';
  unit?: string;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

export interface CategoryQuestionGroup {
  categoryKey: string;
  categoryLabel: string;
  description: string;
  questions: QuestionDefinition[];
}

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(QuestionnaireSubmission) private submissionModel: typeof QuestionnaireSubmission,
    @InjectModel(Project) private projectModel: typeof Project,
    private paymentsService: PaymentsService,
  ) { }

  getQuestionnaireDefinition(): CategoryQuestionGroup[] {
    return [
      {
        categoryKey: 'accessibility_transportation',
        categoryLabel: 'Accessibility & Transportation',
        description: 'How well residents, workers, and visitors move into and around your community.',
        questions: [
          { key: 'transit_airport_name', label: 'Airport Name', type: 'text', placeholder: 'e.g., Commercial / Regional Airport Name' },
          { key: 'transit_airport_count', label: 'Airport Options (#)', type: 'number', unit: 'facilities' },
          { key: 'transit_train_count', label: 'Train / Passenger Rail Stations (#)', type: 'number', unit: 'stations' },
          { key: 'transit_rapid_bus_count', label: 'Rapid Bus Transit Lines (#)', type: 'number', unit: 'lines' },
          { key: 'transit_city_bus_count', label: 'City Bus Routes (#)', type: 'number', unit: 'routes' },
          { key: 'transit_trolley_count', label: 'Trolley / Other (#)', type: 'number', unit: 'vehicles' },
          { key: 'transit_rideshare_count', label: 'Local Rideshare / Micro-Transit Options (#)', type: 'number', unit: 'services' },
          { key: 'transit_bike_ped_plan', label: 'Is there a current Bike/Pedestrian Plan?', type: 'boolean' },
          { key: 'transit_bike_ped_date', label: 'Bike/Pedestrian Plan Date', type: 'date' },
          { key: 'transit_transp_plan', label: 'Is there a current Transportation Plan?', type: 'boolean' },
          { key: 'transit_transp_plan_date', label: 'Transportation Plan Date', type: 'date' },
          { key: 'transit_notes', label: 'Accessibility & Transportation Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'arts_culture',
        categoryLabel: 'Arts & Culture',
        description: 'Cultural facilities, events, and support for local artists.',
        questions: [
          { key: 'arts_public_art_installations', label: 'Public Art installations (including sculptures and murals)?', type: 'boolean' },
          { key: 'arts_public_art_count', label: 'Public Art Installations (#)', type: 'number', unit: 'installations' },
          { key: 'arts_murals_count', label: 'Murals (#)', type: 'number', unit: 'murals' },
          { key: 'arts_public_art_map', label: 'Public Art Map available? (provide map or link)', type: 'boolean' },
          { key: 'arts_public_art_map_link', label: 'Public Art Map URL / Link', type: 'text', placeholder: 'https://...' },
          { key: 'arts_cultural_facilities_count', label: 'Event Venues & Cultural facilities (Theatre, museum, art, music) (#)', type: 'number', unit: 'facilities' },
          { key: 'arts_cultural_facilities_list', label: 'Cultural facilities list (theatres, museums, music/art venues)', type: 'textarea', placeholder: 'Please list venues below...' },
          { key: 'arts_theaters_count', label: 'Performing Arts Theaters & Music Venues', type: 'number', unit: 'venues' },
          { key: 'arts_museums_count', label: 'Museums & Heritage Centers', type: 'number', unit: 'facilities' },
          { key: 'arts_community_centers_count', label: 'Cultural / Community Arts Centers', type: 'number', unit: 'centers' },
          { key: 'arts_festivals_count', label: 'Event Programs (Holiday and/or special Festivals etc.) (#)', type: 'number', unit: 'events/yr' },
          { key: 'arts_festivals_list', label: 'Event Programs list (Festivals, Parades, Holiday events)', type: 'textarea', placeholder: 'Please list event programs below...' },
          { key: 'arts_notes', label: 'Arts & Culture Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'crime_public_safety',
        categoryLabel: 'Crime & Public Safety',
        description: 'Law enforcement staffing, emergency response, and community safety.',
        questions: [
          { key: 'safety_municipal_officers_count', label: 'Municipal Law Enforcement Officers (#)', type: 'number', unit: 'officers' },
          { key: 'safety_county_sheriff_deputies_count', label: 'County Sheriff Sworn Deputies (#)', type: 'number', unit: 'deputies' },
          { key: 'safety_meets_national_ratio', label: 'Do you know your ratio of law enforcement to civilian population? Does it meet national standard of 2.8 officers per 1,000 residents?', type: 'boolean' },
          { key: 'safety_calculated_ratio', label: 'Current Officer-to-1,000 Residents Ratio (if known)', type: 'number', placeholder: '2.8' },
          { key: 'safety_community_policing', label: 'Active Community Watch or Citizen Advisory Programs in place?', type: 'boolean' },
          { key: 'safety_fire_departments_count', label: 'Fire & Rescue Stations (#)', type: 'number', unit: 'stations' },
          { key: 'safety_iso_rating', label: 'Fire ISO Rating (1 = Best, 10 = Worst)', type: 'number', placeholder: '3' },
          { key: 'safety_notes', label: 'Crime & Public Safety Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'education',
        categoryLabel: 'Education',
        description: 'Educational resources, trade schools, and higher educational attainment.',
        questions: [
          { key: 'edu_comm_college_count', label: 'Community College / Trade School (#)', type: 'number', unit: 'institutions' },
          { key: 'edu_comm_college_names', label: 'Community College / Trade School Names & Offerings', type: 'text', placeholder: 'e.g., Central Carolina Community College' },
          { key: 'edu_universities_count', label: 'College / Universities (#)', type: 'number', unit: 'institutions' },
          { key: 'edu_universities_names', label: 'College / University Names & Offerings', type: 'text', placeholder: 'e.g., Campbell University, UNC' },
          { key: 'edu_closest_higher_ed_miles', label: 'Closest proximity (miles) to a community college or university', type: 'number', unit: 'miles' },
          { key: 'edu_closest_higher_ed_name', label: 'Closest Institution Name & Location', type: 'text', placeholder: 'e.g., CCCC Sanford Campus' },
          { key: 'edu_pre_k_programs', label: 'Publicly funded Pre-K or Head Start programs available?', type: 'boolean' },
          { key: 'edu_stem_cte_initiatives', label: 'Active Career & Technical Education (CTE) programs in high schools?', type: 'boolean' },
          { key: 'edu_notes', label: 'Education Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'employment_labor',
        categoryLabel: 'Employment & Labor',
        description: 'Workforce opportunity, business headquarters, and economic drivers.',
        questions: [
          { key: 'labor_fortune_500_hq', label: 'Do you have any large business headquarters or Fortune 500 companies?', type: 'boolean' },
          { key: 'labor_employers_500_plus', label: 'Companies located in municipality/region with 500+ employees (#)', type: 'number', unit: 'companies' },
          { key: 'labor_employers_1000_plus', label: 'Companies located in municipality/region with 1,000+ employees (#)', type: 'number', unit: 'companies' },
          { key: 'labor_major_employers_list', label: 'List Major Employers Below', type: 'textarea', placeholder: 'e.g. Caterpillar, Pfizer, County Health System' },
          { key: 'labor_shovel_ready_inventory', label: 'Do you have an inventory of "shovel-ready" development sites with relevant details and contact information?', type: 'boolean' },
          { key: 'labor_pad_ready_sites', label: '"Certified pad ready" sites (Duke/Electricities, etc.) to offer for relocation/expansion (#)', type: 'number', unit: 'sites' },
          { key: 'labor_pad_ready_acres', label: 'Total Acreage of Available Pad-Ready Land', type: 'number', unit: 'acres' },
          { key: 'labor_buildings_over_5000_sf', label: 'Buildings available for business relocation/expansion > 5,000 SF (#)', type: 'number', unit: 'buildings' },
          { key: 'labor_notes', label: 'Employment & Labor Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'goods_services',
        categoryLabel: 'Goods & Services',
        description: 'Retail vitality, food security, and essential neighborhood services.',
        questions: [
          { key: 'goods_farm_stands_count', label: 'Are fresh foods available via farm stands or farmers markets? (#)', type: 'number', unit: 'markets' },
          { key: 'goods_farmers_market_locations', label: 'Farm stands & farmers market locations', type: 'textarea', placeholder: 'Please list market locations...' },
          { key: 'goods_missing_services', label: 'What goods or services are missing from your community?', type: 'textarea', placeholder: 'List missing services or retail gaps...' },
          { key: 'goods_primary_shopping_districts', label: 'Where are your primary shopping districts?', type: 'textarea', placeholder: 'List primary commercial & shopping districts...' },
          { key: 'goods_buy_local_program', label: 'Do you have a "buy local" program established to promote shopping at locally owned businesses?', type: 'boolean' },
          { key: 'goods_supermarkets_count', label: 'Full-Service Grocery Stores & Supermarkets (#)', type: 'number', unit: 'stores' },
          { key: 'goods_banks_credit_unions', label: 'Commercial Banks & Credit Union Branches (#)', type: 'number', unit: 'branches' },
          { key: 'goods_pharmacies_count', label: 'Retail Pharmacies / Drug Stores (#)', type: 'number', unit: 'stores' },
          { key: 'goods_downtown_retail_vacancy', label: 'Estimated Downtown / Core Commercial Vacancy Rate (%)', type: 'number', unit: '%' },
          { key: 'goods_notes', label: 'Goods & Services Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'healthcare_wellness',
        categoryLabel: 'Healthcare & Wellness',
        description: 'Status of public health, clinical access, and preventive recreation.',
        questions: [
          { key: 'health_hospitals_count', label: 'Hospitals in your community (#)', type: 'number', unit: 'hospitals' },
          { key: 'health_hospital_beds_count', label: 'Total hospital beds offered (#)', type: 'number', unit: 'beds' },
          { key: 'health_urgent_care_count', label: 'Additional clinics and medical facilities available (#)', type: 'number', unit: 'clinics' },
          { key: 'health_healthy_food_options_count', label: 'Healthy food options offering fresh produce (grocery stores and/or farmers markets) (# of both)', type: 'number', unit: 'options' },
          { key: 'health_underinsured_services', label: 'Does the municipality or county provide health services to the under- or un-insured, either directly or through local care providers?', type: 'boolean' },
          { key: 'health_impact_assessments', label: 'Do municipal/county health officials conduct Health Impact Assessments?', type: 'boolean' },
          { key: 'health_impact_assessment_date', label: 'Date of last Health Impact Assessment', type: 'date' },
          { key: 'health_mental_health_facilities', label: 'Dedicated Mental Health / Behavioral Care Facilities (#)', type: 'number', unit: 'facilities' },
          { key: 'health_fitness_centers_count', label: 'Gyms, YMCAs & Public Fitness Centers (#)', type: 'number', unit: 'centers' },
          { key: 'health_notes', label: 'Healthcare & Wellness Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'historic_preservation',
        categoryLabel: 'Historic Preservation',
        description: 'Preserving and honoring local architectural, cultural, and historic assets.',
        questions: [
          { key: 'historic_local_districts_count', label: 'Historic districts (#)', type: 'number', unit: 'districts' },
          { key: 'historic_main_street_manager', label: 'Do you have Downtown or Main St. Manager(s)?', type: 'boolean' },
          { key: 'historic_national_register_count', label: 'Buildings that are historically registered (#)', type: 'number', unit: 'buildings' },
          { key: 'historic_rehab_tax_credit_projects', label: 'Buildings offering or improved using historic tax credits (#)', type: 'number', unit: 'buildings' },
          { key: 'historic_main_street_program', label: 'Do you have or are designated as a Main Street Program?', type: 'boolean' },
          { key: 'historic_bid_msd_district', label: 'Do you have a business improvement district(s) (BID or MSD) or similar special taxing district?', type: 'boolean' },
          { key: 'historic_bid_msd_locations', label: 'BID / MSD Location(s)', type: 'text', placeholder: 'Location(s)...' },
          { key: 'historic_tour_maps_assets', label: 'Do you offer historic tour maps or other historic tourism related assets?', type: 'boolean' },
          { key: 'historic_tour_maps_details', label: 'Historic tour maps / tourism assets details', type: 'textarea', placeholder: 'Provide details...' },
          { key: 'historic_preservation_commission', label: 'Active Historic Preservation Commission / Board?', type: 'boolean' },
          { key: 'historic_preservation_guidelines', label: 'Adopted Historic Design Guidelines / Ordinances in effect?', type: 'boolean' },
          { key: 'historic_notes', label: 'Historic Preservation Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'population_housing',
        categoryLabel: 'Population & Housing',
        description: 'Adequate, diverse, and affordable housing for all generations.',
        questions: [
          { key: 'housing_authority', label: 'Do you have a Housing Authority?', type: 'boolean' },
          { key: 'housing_authority_services', label: 'What services / housing options does the Housing Authority provide?', type: 'textarea', placeholder: 'Describe services and housing options...' },
          { key: 'housing_annual_permits_issued', label: 'Total housing units permitted last year (#)', type: 'number', unit: 'permits' },
          { key: 'housing_affordable_programs', label: 'Do you have an affordable/workforce housing program or goals?', type: 'boolean' },
          { key: 'housing_affordable_program_details', label: 'Affordable / workforce housing program details', type: 'textarea', placeholder: 'Explain program or goals here...' },
          { key: 'housing_single_family_ratio', label: 'Estimated Single-Family Home Share of Inventory (%)', type: 'number', unit: '%' },
          { key: 'housing_multifamily_ratio', label: 'Estimated Multifamily / Apartment Share of Inventory (%)', type: 'number', unit: '%' },
          { key: 'housing_needs_assessment_date', label: 'Date of Most Recent Housing Needs Study', type: 'date' },
          { key: 'housing_notes', label: 'Housing Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'infrastructure',
        categoryLabel: 'Infrastructure',
        description: 'Water, wastewater, stormwater, and high-speed broadband capacity.',
        questions: [
          { key: 'infra_water_provider_capacity', label: 'Water Service: Who provides it, status of capacity, issues and/or expansion plans?', type: 'textarea', placeholder: 'Water provider, capacity status, expansion plans...' },
          { key: 'infra_sewer_provider_capacity', label: 'Sewer Service: Who provides it, status of capacity, issues and/or expansion plans?', type: 'textarea', placeholder: 'Sewer provider, capacity status, expansion plans...' },
          { key: 'infra_electric_provider_capacity', label: 'Electricity: Who provides it, status of capacity, issues and/or expansion plans?', type: 'textarea', placeholder: 'Electric provider, capacity status, expansion plans...' },
          { key: 'infra_broadband_provider', label: 'Broadband / Internet: Adequate access? Who is the provider?', type: 'textarea', placeholder: 'Provider and internet access adequacy...' },
          { key: 'infra_roadway_expansion_plans', label: 'Roadway expansion or improvement plans outside of State DOT - STIP’s?', type: 'boolean' },
          { key: 'infra_roadway_plans_description', label: 'Roadway expansion location & description', type: 'textarea', placeholder: 'Location and description...' },
          { key: 'infra_stormwater_quality_assessment', label: 'Accurate assessment of your current stormwater quality via state agency?', type: 'textarea', placeholder: 'State agency assessment details...' },
          { key: 'infra_emergency_evacuation_plan', label: 'Current emergency evacuation plan for natural disasters (signage and dedicated planning with law enforcement)?', type: 'textarea', placeholder: 'Evacuation plan details...' },
          { key: 'infra_green_energy_incentives', label: 'Are there green energy alternatives or incentives offered (wind, solar, or "green" construction)?', type: 'boolean' },
          { key: 'infra_green_energy_details', label: 'Green energy alternatives & incentives description', type: 'textarea', placeholder: 'Details of green energy alternatives...' },
          { key: 'infra_water_utilization_pct', label: 'Municipal Water System Peak Capacity Utilization (%)', type: 'number', unit: '%' },
          { key: 'infra_wastewater_utilization_pct', label: 'Wastewater Treatment Plant Peak Capacity Utilization (%)', type: 'number', unit: '%' },
          { key: 'infra_broadband_fiber_pct', label: 'High-Speed Fiber / Broadband Residential Coverage (%)', type: 'number', unit: '%' },
          { key: 'infra_stormwater_utility', label: 'Dedicated Stormwater Utility / Enterprise Fund in place?', type: 'boolean' },
          { key: 'infra_renewable_projects', label: 'Utility-scale Solar / Renewable Energy Installations in jurisdiction (#)', type: 'number', unit: 'facilities' },
          { key: 'infra_notes', label: 'Infrastructure Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'open_space_recreation',
        categoryLabel: 'Open Space & Recreation',
        description: 'Passive and active recreational assets, trails, water access, and parks.',
        questions: [
          { key: 'rec_master_plan', label: 'Do you have a current Recreation Plan(s)?', type: 'boolean' },
          { key: 'rec_greenway_plan', label: 'Greenway Plan in place?', type: 'boolean' },
          { key: 'rec_greenway_plan_date', label: 'Date of last Greenway Plan', type: 'date' },
          { key: 'rec_director', label: 'Do you have Park and Rec. Director(s)?', type: 'boolean' },
          { key: 'rec_greenways_condition', label: 'Greenways count, approximate length, and condition', type: 'textarea', placeholder: 'How many, roughly how long, and what condition are they in...' },
          { key: 'rec_natural_assets_count', label: 'Natural recreational assets (ocean, lake or river access, mountain trails, outdoor recreation) (#)', type: 'number', unit: 'assets' },
          { key: 'rec_natural_assets_description', label: 'Natural recreational assets description and location', type: 'textarea', placeholder: 'Description and location of natural assets...' },
          { key: 'rec_designated_open_spaces_count', label: 'Large designated public open spaces (sports or passive/active parks) (#)', type: 'number', unit: 'parks' },
          { key: 'rec_designated_open_spaces_locations', label: 'Large designated public open spaces locations', type: 'textarea', placeholder: 'Locations of sports or passive/active parks...' },
          { key: 'rec_conservation_ordinances', label: 'Conservation ordinances in place to protect wildlife and prevent development of crucial ecological ecosystems?', type: 'textarea', placeholder: 'Conservation ordinance details...' },
          { key: 'rec_national_state_parks', label: 'National or State Parks in your community or county that residents/visitors can enjoy', type: 'textarea', placeholder: 'List national or state parks...' },
          { key: 'rec_public_parks_count', label: 'Public Parks & Nature Preserves (#)', type: 'number', unit: 'parks' },
          { key: 'rec_public_parks_acres', label: 'Total Public Park Acreage', type: 'number', unit: 'acres' },
          { key: 'rec_trails_miles', label: 'Miles of Paved / Maintained Walking & Biking Greenways', type: 'number', unit: 'miles' },
          { key: 'rec_public_water_access', label: 'Public Boat Ramps / Kayak Launches / Lake Access Points (#)', type: 'number', unit: 'points' },
          { key: 'rec_notes', label: 'Open Space & Recreation Notes / Comments', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'planning_land_use',
        categoryLabel: 'Planning & Land Use',
        description: 'Forward-looking comprehensive planning, zoning modernizations, and staffing.',
        questions: [
          { key: 'plan_comp_plan_date', label: 'Date of last Comprehensive Plan Update', type: 'date' },
          { key: 'plan_zoning_update_date', label: 'Date of last Zoning Ordinance Update', type: 'date' },
          { key: 'plan_voluntary_ag_districts', label: 'Are there any Voluntary Agricultural Districts (VAD or EVAD)?', type: 'boolean' },
          { key: 'plan_tax_base_residential_pct', label: 'Tax Base: Residential Share of Total Valuation (%)', type: 'number', unit: '%' },
          { key: 'plan_tax_base_commercial_pct', label: 'Tax Base: Commercial Share of Total Valuation (%)', type: 'number', unit: '%' },
          { key: 'plan_available_development_acreage', label: 'Adequate land available for potential development? Roughly how much acreage / land capacity?', type: 'textarea', placeholder: 'Describe land availability and acreage capacity...' },
          { key: 'plan_tax_exempt_acreage', label: 'Tax-exempt acreage (institutions, schools, churches) not generating property tax revenue (# acres total)', type: 'textarea', placeholder: 'Total acres and details...' },
          { key: 'plan_growth_and_ag_preservation', label: 'Do local plans and ordinances designate growth areas for future development and areas for agricultural preservation?', type: 'boolean' },
          { key: 'plan_mixed_use_zoning', label: 'Does Zoning allow for Mixed-Use Development?', type: 'boolean' },
          { key: 'plan_sidewalks_required', label: 'Do Subdivision regulations require sidewalks on new streets/development areas?', type: 'boolean' },
          { key: 'plan_open_space_standards', label: 'Do local zoning codes establish minimum standards for parks and open space in new developments?', type: 'boolean' },
          { key: 'plan_sensitive_areas_protection', label: 'Do land development regulations protect steep slopes, wetlands, floodplains and other sensitive areas?', type: 'boolean' },
          { key: 'plan_comp_plan_adopted', label: 'Active Comprehensive Land Use Master Plan adopted?', type: 'boolean' },
          { key: 'plan_udo_modern_zoning', label: 'Unified Development Ordinance (UDO) / Form-Based Code adopted?', type: 'boolean' },
          { key: 'plan_downtown_revitalization_plan', label: 'Downtown / Main Street Revitalization Plan in place?', type: 'boolean' },
          { key: 'plan_capital_improvement_cip', label: 'Formal 5-Year Capital Improvement Plan (CIP) funded?', type: 'boolean' },
          { key: 'plan_dedicated_gis_planner', label: 'Full-Time Professional Planning / GIS Staff employed?', type: 'boolean' },
          { key: 'plan_notes', label: 'Planning & Land Use Notes / Comments', type: 'textarea' },
        ],
      },
    ];
  }

  async getSubmission(projectId: string): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let submission = await this.submissionModel.findOne({ where: { projectId } });
    const definition = this.getQuestionnaireDefinition();
    const totalQuestions = definition.reduce((sum, cat) => sum + cat.questions.length, 0);

    if (!submission) {
      submission = await this.submissionModel.create({
        projectId,
        status: QuestionnaireStatus.DRAFT,
        completedPointsCount: 0,
        totalPointsCount: totalQuestions,
        answersPayload: {},
      });
    }

    return {
      projectId,
      submissionId: submission.id,
      status: submission.status,
      completedPointsCount: submission.completedPointsCount,
      totalPointsCount: totalQuestions,
      percentageCompleted: totalQuestions > 0 ? Math.round((submission.completedPointsCount / totalQuestions) * 100) : 0,
      answersPayload: submission.answersPayload || {},
      submittedAt: submission.submittedAt,
      categories: definition,
    };
  }

  async saveDraft(projectId: string, answers: Record<string, any>): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let submission = await this.submissionModel.findOne({ where: { projectId } });
    const definition = this.getQuestionnaireDefinition();
    const totalQuestions = definition.reduce((sum, cat) => sum + cat.questions.length, 0);

    const mergedPayload = { ...(submission?.answersPayload || {}), ...answers };
    const answeredCount = Object.keys(mergedPayload).filter((k) => {
      const v = mergedPayload[k]?.value !== undefined ? mergedPayload[k].value : mergedPayload[k];
      return v !== null && v !== undefined && v !== '';
    }).length;

    if (!submission) {
      submission = await this.submissionModel.create({
        projectId,
        status: QuestionnaireStatus.DRAFT,
        completedPointsCount: answeredCount,
        totalPointsCount: totalQuestions,
        answersPayload: mergedPayload,
      });
    } else {
      await submission.update({
        answersPayload: mergedPayload,
        completedPointsCount: answeredCount,
      });
    }

    return {
      projectId,
      status: submission.status,
      completedPointsCount: answeredCount,
      totalPointsCount: totalQuestions,
      answersPayload: mergedPayload,
    };
  }

  async submitQuestionnaire(projectId: string, answers?: Record<string, any>): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let submission = await this.submissionModel.findOne({ where: { projectId } });
    const definition = this.getQuestionnaireDefinition();
    const totalQuestions = definition.reduce((sum, cat) => sum + cat.questions.length, 0);

    const mergedPayload = answers
      ? { ...(submission?.answersPayload || {}), ...answers }
      : (submission?.answersPayload || {});

    const answeredCount = Object.keys(mergedPayload).filter((k) => {
      const v = mergedPayload[k]?.value !== undefined ? mergedPayload[k].value : mergedPayload[k];
      return v !== null && v !== undefined && v !== '';
    }).length;

    if (!submission) {
      submission = await this.submissionModel.create({
        projectId,
        status: QuestionnaireStatus.SUBMITTED,
        completedPointsCount: answeredCount,
        totalPointsCount: totalQuestions,
        answersPayload: mergedPayload,
        submittedAt: new Date(),
      });
    } else {
      await submission.update({
        status: QuestionnaireStatus.SUBMITTED,
        answersPayload: mergedPayload,
        completedPointsCount: answeredCount,
        submittedAt: new Date(),
      });
    }

    // Auto-advance 30% milestone (Bypassed)
    await this.paymentsService.advanceMilestone(projectId, MilestoneType.MID_30);

    // Update project status to INTAKE_SUBMITTED
    await project.update({ status: ProjectStatus.INTAKE_SUBMITTED });

    return {
      projectId,
      status: QuestionnaireStatus.SUBMITTED,
      completedPointsCount: answeredCount,
      totalPointsCount: totalQuestions,
      submittedAt: submission.submittedAt,
      nextStep: 'Questionnaire submitted successfully',
    };
  }
}
