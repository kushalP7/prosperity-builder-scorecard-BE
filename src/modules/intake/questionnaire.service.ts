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
          { key: 'transit_airport_name', label: 'Commercial / Regional Airport Name', type: 'text', placeholder: 'e.g., Raleigh-Durham / Regional Airport' },
          { key: 'transit_airport_count', label: 'Number of Public/Private Airports within 30 min', type: 'number', unit: 'facilities' },
          { key: 'transit_train_count', label: 'Passenger Rail / Train Stations', type: 'number', unit: 'stations' },
          { key: 'transit_rapid_bus_count', label: 'Rapid Bus Transit (BRT) Lines', type: 'number', unit: 'lines' },
          { key: 'transit_city_bus_count', label: 'City / Municipal Bus Fixed Routes', type: 'number', unit: 'routes' },
          { key: 'transit_trolley_count', label: 'Trolley / Circulator Services', type: 'number', unit: 'vehicles' },
          { key: 'transit_rideshare_count', label: 'Micro-transit / On-Demand Van Service Options', type: 'number', unit: 'services' },
          { key: 'transit_bike_ped_plan', label: 'Is there an active Bike / Pedestrian Plan?', type: 'boolean' },
          { key: 'transit_bike_ped_date', label: 'Bike/Ped Plan Adoption Date', type: 'date', placeholder: 'YYYY or MM/YYYY' },
          { key: 'transit_transp_plan', label: 'Is there a Comprehensive Transportation Master Plan?', type: 'boolean' },
          { key: 'transit_transp_plan_date', label: 'Transportation Plan Adoption Date', type: 'text', placeholder: 'YYYY or MM/YYYY' },
          { key: 'transit_notes', label: 'Accessibility & Transportation Notes / Initiatives', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'arts_culture',
        categoryLabel: 'Arts & Culture',
        description: 'Cultural facilities, events, and support for local artists.',
        questions: [
          { key: 'arts_public_art_installations', label: 'Public Art Installations (sculptures, murals, monuments)', type: 'boolean' },
          { key: 'arts_public_art_map', label: 'Public Art Map or Interactive Walking Tour available?', type: 'boolean' },
          { key: 'arts_public_art_map_link', label: 'Public Art Map URL / Link', type: 'text', placeholder: 'https://...' },
          { key: 'arts_theaters_count', label: 'Performing Arts Theaters & Music Venues', type: 'number', unit: 'venues' },
          { key: 'arts_museums_count', label: 'Museums & Heritage Centers', type: 'number', unit: 'facilities' },
          { key: 'arts_community_centers_count', label: 'Cultural / Community Arts Centers', type: 'number', unit: 'centers' },
          { key: 'arts_festivals_count', label: 'Annual Major Festivals, Parades & Cultural Programs', type: 'number', unit: 'events/yr' },
          { key: 'arts_festivals_list', label: 'Key Annual Events / Programs List', type: 'textarea', placeholder: 'e.g. Autumn Leaf Festival, Historic Home Tour, Blues & Brews' },
          { key: 'arts_notes', label: 'Arts & Culture General Notes', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'crime_public_safety',
        categoryLabel: 'Crime & Public Safety',
        description: 'Law enforcement staffing, emergency response, and community safety.',
        questions: [
          { key: 'safety_municipal_officers_count', label: 'Municipal Police Department Sworn Officers', type: 'number', unit: 'officers' },
          { key: 'safety_county_sheriff_deputies_count', label: 'County Sheriff Sworn Deputies assigned to area', type: 'number', unit: 'deputies' },
          { key: 'safety_meets_national_ratio', label: 'Does your staffing meet national standard (2.8 officers per 1,000 residents)?', type: 'boolean' },
          { key: 'safety_calculated_ratio', label: 'Current Officer-to-1,000 Residents Ratio (if known)', type: 'number', placeholder: '2.4' },
          { key: 'safety_community_policing', label: 'Active Community Watch or Citizen Advisory Programs in place?', type: 'boolean' },
          { key: 'safety_fire_departments_count', label: 'Fire & Rescue Stations', type: 'number', unit: 'stations' },
          { key: 'safety_iso_rating', label: 'Fire ISO Rating (1 = Best, 10 = Worst)', type: 'number', placeholder: '3' },
          { key: 'safety_notes', label: 'Public Safety Comments & Local Observations', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'education',
        categoryLabel: 'Education',
        description: 'Educational resources, trade schools, and higher educational attainment.',
        questions: [
          { key: 'edu_comm_college_count', label: 'Community Colleges / Vocational Trade Centers within boundary', type: 'number', unit: 'institutions' },
          { key: 'edu_comm_college_names', label: 'Community College / Trade School Names', type: 'text', placeholder: 'e.g., Central Carolina Community College' },
          { key: 'edu_universities_count', label: '4-Year Colleges / Universities within county/region', type: 'number', unit: 'institutions' },
          { key: 'edu_universities_names', label: 'University Names', type: 'text', placeholder: 'e.g., Campbell University, UNC' },
          { key: 'edu_closest_higher_ed_miles', label: 'Proximity to Closest Higher Education Institution (miles)', type: 'number', unit: 'miles' },
          { key: 'edu_pre_k_programs', label: 'Publicly funded Pre-K or Head Start programs available?', type: 'boolean' },
          { key: 'edu_stem_cte_initiatives', label: 'Active Career & Technical Education (CTE) programs in high schools?', type: 'boolean' },
          { key: 'edu_notes', label: 'Education Initiatives & Challenges', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'employment_labor',
        categoryLabel: 'Employment & Labor',
        description: 'Workforce opportunity, business headquarters, and economic drivers.',
        questions: [
          { key: 'labor_fortune_500_hq', label: 'Corporate Headquarters or Fortune 500/1000 presence?', type: 'boolean' },
          { key: 'labor_employers_500_plus', label: 'Number of employers with 500+ employees', type: 'number', unit: 'companies' },
          { key: 'labor_employers_1000_plus', label: 'Number of employers with 1,000+ employees', type: 'number', unit: 'companies' },
          { key: 'labor_major_employers_list', label: 'List Top 3-5 Major Employers', type: 'textarea', placeholder: 'e.g. Caterpillar, Pfizer, County Health System' },
          { key: 'labor_pad_ready_sites', label: 'Certified Pad-Ready Industrial / Commercial Sites', type: 'number', unit: 'sites' },
          { key: 'labor_pad_ready_acres', label: 'Total Acreage of Available Pad-Ready Land', type: 'number', unit: 'acres' },
          { key: 'labor_buildings_over_5000_sf', label: 'Available Spec/Commercial Buildings > 5,000 SF', type: 'number', unit: 'buildings' },
          { key: 'labor_notes', label: 'Employment & Labor Market Notes', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'goods_services',
        categoryLabel: 'Goods & Services',
        description: 'Retail vitality, food security, and essential neighborhood services.',
        questions: [
          { key: 'goods_supermarkets_count', label: 'Full-Service Grocery Stores & Supermarkets', type: 'number', unit: 'stores' },
          { key: 'goods_farmers_market', label: 'Regular Community Farmers Market operating?', type: 'boolean' },
          { key: 'goods_banks_credit_unions', label: 'Commercial Banks & Credit Union Branches', type: 'number', unit: 'branches' },
          { key: 'goods_pharmacies_count', label: 'Retail Pharmacies / Drug Stores', type: 'number', unit: 'stores' },
          { key: 'goods_downtown_retail_vacancy', label: 'Estimated Downtown / Core Commercial Vacancy Rate (%)', type: 'number', unit: '%' },
          { key: 'goods_notes', label: 'Goods & Services Retail Assessment', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'healthcare_wellness',
        categoryLabel: 'Healthcare & Wellness',
        description: 'Status of public health, clinical access, and preventive recreation.',
        questions: [
          { key: 'health_hospitals_count', label: 'Full-Service General Hospitals', type: 'number', unit: 'hospitals' },
          { key: 'health_hospital_beds_count', label: 'Total Licensed Hospital Beds', type: 'number', unit: 'beds' },
          { key: 'health_urgent_care_count', label: 'Urgent Care & Walk-in Outpatient Clinics', type: 'number', unit: 'clinics' },
          { key: 'health_mental_health_facilities', label: 'Dedicated Mental Health / Behavioral Care Facilities', type: 'number', unit: 'facilities' },
          { key: 'health_fitness_centers_count', label: 'Gyms, YMCAs & Public Fitness Centers', type: 'number', unit: 'centers' },
          { key: 'health_notes', label: 'Healthcare Access & Community Health Notes', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'historic_preservation',
        categoryLabel: 'Historic Preservation',
        description: 'Preserving and honoring local architectural, cultural, and historic assets.',
        questions: [
          { key: 'historic_local_districts_count', label: 'Designated Local Historic Districts', type: 'number', unit: 'districts' },
          { key: 'historic_national_register_count', label: 'Properties / Sites on National Register of Historic Places', type: 'number', unit: 'sites' },
          { key: 'historic_preservation_commission', label: 'Active Historic Preservation Commission / Board?', type: 'boolean' },
          { key: 'historic_preservation_guidelines', label: 'Adopted Historic Design Guidelines / Ordinances in effect?', type: 'boolean' },
          { key: 'historic_rehab_tax_credit_projects', label: 'Historic Rehabilitation Tax Credit Projects completed (last 5 yrs)', type: 'number', unit: 'projects' },
          { key: 'historic_notes', label: 'Historic Preservation Summary', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'population_housing',
        categoryLabel: 'Population & Housing',
        description: 'Adequate, diverse, and affordable housing for all generations.',
        questions: [
          { key: 'housing_single_family_ratio', label: 'Estimated Single-Family Home Share of Inventory (%)', type: 'number', unit: '%' },
          { key: 'housing_multifamily_ratio', label: 'Estimated Multifamily / Apartment Share of Inventory (%)', type: 'number', unit: '%' },
          { key: 'housing_affordable_programs', label: 'Dedicated Municipal / County Affordable Housing Trust or Incentive?', type: 'boolean' },
          { key: 'housing_annual_permits_issued', label: 'Residential Building Permits Issued (past 12 months)', type: 'number', unit: 'permits' },
          { key: 'housing_needs_assessment_date', label: 'Date of Most Recent Housing Needs Study', type: 'text', placeholder: 'YYYY' },
          { key: 'housing_notes', label: 'Housing Affordability & Inventory Observations', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'infrastructure',
        categoryLabel: 'Infrastructure',
        description: 'Water, wastewater, stormwater, and high-speed broadband capacity.',
        questions: [
          { key: 'infra_water_utilization_pct', label: 'Municipal Water System Peak Capacity Utilization (%)', type: 'number', unit: '%' },
          { key: 'infra_wastewater_utilization_pct', label: 'Wastewater Treatment Plant Peak Capacity Utilization (%)', type: 'number', unit: '%' },
          { key: 'infra_broadband_fiber_pct', label: 'High-Speed Fiber / Broadband Residential Coverage (%)', type: 'number', unit: '%' },
          { key: 'infra_stormwater_utility', label: 'Dedicated Stormwater Utility / Enterprise Fund in place?', type: 'boolean' },
          { key: 'infra_renewable_projects', label: 'Utility-scale Solar / Renewable Energy Installations in jurisdiction', type: 'number', unit: 'facilities' },
          { key: 'infra_notes', label: 'Infrastructure Expansion & Maintenance Capacity', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'open_space_recreation',
        categoryLabel: 'Open Space & Recreation',
        description: 'Passive and active recreational assets, trails, water access, and parks.',
        questions: [
          { key: 'rec_public_parks_count', label: 'Public Parks & Nature Preserves', type: 'number', unit: 'parks' },
          { key: 'rec_public_parks_acres', label: 'Total Public Park Acreage', type: 'number', unit: 'acres' },
          { key: 'rec_trails_miles', label: 'Miles of Paved / Maintained Walking & Biking Greenways', type: 'number', unit: 'miles' },
          { key: 'rec_public_water_access', label: 'Public Boat Ramps / Kayak Launches / Lake Access Points', type: 'number', unit: 'access points' },
          { key: 'rec_master_plan', label: 'Comprehensive Parks & Recreation Master Plan adopted?', type: 'boolean' },
          { key: 'rec_master_plan_date', label: 'Parks Master Plan Adoption Year', type: 'text', placeholder: 'YYYY' },
          { key: 'rec_notes', label: 'Recreation Assets & Open Space Quality', type: 'textarea' },
        ],
      },
      {
        categoryKey: 'planning_land_use',
        categoryLabel: 'Planning & Land Use',
        description: 'Forward-looking comprehensive planning, zoning modernizations, and staffing.',
        questions: [
          { key: 'plan_comp_plan_adopted', label: 'Active Comprehensive Land Use Master Plan adopted?', type: 'boolean' },
          { key: 'plan_comp_plan_year', label: 'Comp Plan Adoption / Major Revision Year', type: 'text', placeholder: 'YYYY' },
          { key: 'plan_udo_modern_zoning', label: 'Unified Development Ordinance (UDO) / Form-Based Code adopted?', type: 'boolean' },
          { key: 'plan_downtown_revitalization_plan', label: 'Downtown / Main Street Revitalization Plan in place?', type: 'boolean' },
          { key: 'plan_capital_improvement_cip', label: 'Formal 5-Year Capital Improvement Plan (CIP) funded?', type: 'boolean' },
          { key: 'plan_dedicated_gis_planner', label: 'Full-Time Professional Planning / GIS Staff employed?', type: 'boolean' },
          { key: 'plan_notes', label: 'Planning Capacity, Strategic Goals & Land Use Notes', type: 'textarea' },
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

    // Update project status to INGESTION_RUNNING
    await project.update({ status: ProjectStatus.INGESTION_RUNNING });

    return {
      projectId,
      status: QuestionnaireStatus.SUBMITTED,
      completedPointsCount: answeredCount,
      totalPointsCount: totalQuestions,
      submittedAt: submission.submittedAt,
      nextStep: 'Automated API Ingestion Service running in background',
    };
  }
}
