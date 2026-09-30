import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { TemplateCategory } from '../templates/entities/template-category.entity';
import { TemplateGroup } from '../templates/entities/template-group.entity';
import { TemplateColumn, ColumnType } from '../templates/entities/template-column.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { AppSettings } from '../settings/entities/app-settings.entity';
import { RatingBand } from '../settings/entities/rating-band.entity';
import { User } from '../users/entities/user.entity';
import { PasswordService } from '../auth/services/password.service';
import { PaymentMilestone, MilestoneType, PaymentStatus } from '../payments/entities/payment-milestone.entity';
import { QuestionnaireSubmission, QuestionnaireStatus } from '../intake/entities/questionnaire-submission.entity';
import { ScorecardRollup } from '../engine/entities/scorecard-rollup.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(TemplateSection) private sectionModel: typeof TemplateSection,
    @InjectModel(TemplateCategory) private categoryModel: typeof TemplateCategory,
    @InjectModel(TemplateGroup) private groupModel: typeof TemplateGroup,
    @InjectModel(TemplateColumn) private columnModel: typeof TemplateColumn,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(AppSettings) private settingsModel: typeof AppSettings,
    @InjectModel(RatingBand) private ratingBandModel: typeof RatingBand,
    @InjectModel(User) private userModel: typeof User,
    private readonly passwordService: PasswordService,
    @InjectModel(PaymentMilestone) private milestoneModel: typeof PaymentMilestone,
    @InjectModel(QuestionnaireSubmission) private questionnaireModel: typeof QuestionnaireSubmission,
    @InjectModel(ScorecardRollup) private rollupModel: typeof ScorecardRollup,
    private sequelize: Sequelize,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedUsers();
  }

  async seedUsers(): Promise<void> {
    try {
      this.logger.log('Syncing and migrating RBAC user accounts with Argon2 hashes...');

      // Ensure Users.role column is VARCHAR(50) in PostgreSQL
      try {
        await this.sequelize.query('ALTER TABLE IF EXISTS "Users" ALTER COLUMN role TYPE VARCHAR(50) USING role::text');
      } catch {
        // Ignored if already VARCHAR(50) or table doesn't exist yet
      }
      try {
        await this.sequelize.query('ALTER TABLE IF EXISTS "users" ALTER COLUMN role TYPE VARCHAR(50) USING role::text');
      } catch {
        // Ignored if already VARCHAR(50)
      }

      // Auto-migrate any legacy role strings in PostgreSQL database
      await this.userModel.update({ role: 'super_admin' }, { where: { role: 'admin' } });
      await this.userModel.update({ role: 'project_lead' }, { where: { role: 'manager' } });
      await this.userModel.update({ role: 'assessment_specialist' }, { where: { role: 'analyst' } });
      await this.userModel.update({ role: 'client_viewer' }, { where: { role: 'viewer' } });

      const defaultUsers = [
        {
          name: 'Alexander Rose',
          email: 'admin@roseassociates.com',
          password: 'admin123',
          role: 'super_admin' as const,
          department: 'Executive Board',
          status: 'active' as const,
          avatarBg: 'bg-[#7c0d15] text-white',
        },
        {
          name: 'Samantha Vance',
          email: 'svance@roseassociates.com',
          password: 'manager123',
          role: 'project_lead' as const,
          department: 'Real Estate Development',
          status: 'active' as const,
          avatarBg: 'bg-blue-600 text-white',
        },
        {
          name: 'Marcus Chen',
          email: 'mchen@roseassociates.com',
          password: 'analyst123',
          role: 'assessment_specialist' as const,
          department: 'Urban Analytics',
          status: 'active' as const,
          avatarBg: 'bg-emerald-600 text-white',
        },
        {
          name: 'Elena Rodriguez',
          email: 'erodriguez@roseassociates.com',
          password: 'viewer123',
          role: 'client_viewer' as const,
          department: 'Public Affairs',
          status: 'active' as const,
          avatarBg: 'bg-slate-700 text-white',
        },
      ];

      // Upsert/migrate users to new domain roles
      for (const u of defaultUsers) {
        const existing = await this.userModel.findOne({ where: { email: u.email } });
        if (existing) {
          await existing.update({ role: u.role, name: u.name, department: u.department });
        } else {
          const hashedPassword = await this.passwordService.hash(u.password);
          await this.userModel.create({
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            department: u.department,
            status: u.status,
            avatarBg: u.avatarBg,
            lastActive: new Date(),
          });
        }
      }

      this.logger.log('✅ Successfully synced domain roles: super_admin, project_lead, assessment_specialist, client_viewer.');
    } catch (err: any) {
      this.logger.error(`Error seeding users: ${err.message}`);
    }
  }

  async populateSampleData(): Promise<void> {
    await this.seedUsers();
    const existingProjectCount = await this.projectModel.count();
    if (existingProjectCount > 0) {
      this.logger.log('Sample data already exists, skipping seed.');
      return;
    }

    const transaction = await this.sequelize.transaction();
    try {
      this.logger.log('Starting exact 1:1 replica seeding transaction...');

      // AppSettings & Rating Bands
      const [settings] = await this.settingsModel.findOrCreate({
        where: {},
        defaults: {
          companyName: 'Rose Associates',
          companyAddress: '123 Planning Way',
          companyPhone: '555-0100',
        },
        transaction,
      });

      const countBands = await this.ratingBandModel.count({ where: { settingsId: settings.id }, transaction });
      if (countBands === 0) {
        await this.ratingBandModel.bulkCreate(
          [
            { settingsId: settings.id, label: 'Poor', min: 0, max: 20, color: '#B5101A' },
            { settingsId: settings.id, label: 'Average', min: 21, max: 70, color: '#E08A15' },
            { settingsId: settings.id, label: 'Good', min: 71, max: 90, color: '#4B8B3B' },
            { settingsId: settings.id, label: 'Excellent', min: 91, max: 100, color: '#1F6F4A' },
          ],
          { transaction },
        );
      }

      await this.runExactSeedLogic(transaction);

      await transaction.commit();
      this.logger.log('Exact 1:1 seed replica completed successfully!');
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Failed to seed sample data', error);
      throw error;
    }
  }

  async resetAndSeed(): Promise<void> {
    this.logger.log('Truncating database tables for sample data reset...');
    await this.sequelize.truncate({ cascade: true });
    await this.populateSampleData();
  }

  private async runExactSeedLogic(transaction: any) {
    const sectionNames = [
      "Accessibility & Transportation",
      "Arts & Culture",
      "Crime & Public Safety",
      "Education",
      "Employment & Labor",
      "Goods & Services",
      "Healthcare & Wellness",
      "Historic Preservation",
      "Housing",
      "Infrastructure",
      "Open Space & Recreation",
      "Planning & Land Use"
    ];

    const subMetricsMapping: Record<string, string[]> = {
      "Accessibility & Transportation": ['Public Transit Access', 'Pedestrian Infrastructure', 'Bicycle Networks', 'Parking Availability', 'Traffic Flow', 'Road Conditions'],
      "Arts & Culture": ['Galleries & Studios', 'Theaters', 'Public Art Installations', 'Cultural Centers', 'Music Venues', 'Festivals'],
      "Crime & Public Safety": ['Violent Crime Rate', 'Property Crime Rate', 'Police Presence', 'Emergency Response Time', 'Street Lighting', 'Community Policing'],
      "Education": ['Public Schools', 'Private Schools', 'Higher Education', 'Libraries', 'Early Childhood Centers', 'After-School Programs'],
      "Employment & Labor": ['Unemployment Rate', 'Job Growth', 'Major Employers', 'Average Wage', 'Commuting Patterns', 'Workforce Training'],
      "Goods & Services": ['Grocery Stores', 'Retail Centers', 'Pharmacies', 'Banks', 'Restaurants', 'Personal Care Services'],
      "Healthcare & Wellness": ['Hospitals', 'Clinics', 'Pharmacies', 'Mental Health Facilities', 'Fitness Centers', 'Specialty Care'],
      "Historic Preservation": ['Landmarks', 'Districts', 'Monuments', 'Plaques', 'Museums', 'Archives'],
      "Housing": ['Single-Family Homes', 'Multi-Family Units', 'Affordable Housing', 'Rental Rates', 'Home Values', 'Eviction Rates'],
      "Infrastructure": ['Water Supply', 'Sanitation', 'Power Grid', 'Broadband Access', 'Stormwater Management', 'Bridges & Roads'],
      "Open Space & Recreation": ['Parks', 'Trails', 'Playgrounds', 'Sports Fields', 'Recreation Centers', 'Community Gardens'],
      "Planning & Land Use": ['Residential Zoning', 'Commercial Zoning', 'Industrial Zoning', 'Mixed-Use Development', 'Building Permits', 'Vacant Lots']
    };

    const sectionEntities: any[] = [];
    const sampleRecords: Array<{ nodeId: string; columnId: string; value: any; source?: string; notes?: string }> = [];

    let sectionIndex = 1;
    for (const name of sectionNames) {
      const section = await this.sectionModel.create(
        { label: name, accentColor: '#B5111B', icon: 'Layers' },
        { transaction },
      );

      let specificRows: any[] | null = null;

      if (name === "Accessibility & Transportation") {
        specificRows = [
          { cat: 'Major Routes', rows: [
            { name: '*Interstate If \'Data\' None = 0; 1-2 = 1; <2 = 2', d: '0', yn: null, w: 4, h: 8 },
            { name: 'US Highway If \'Data\' 0-1 = 0; 1-3 = 1; <3 = 2', d: '0', yn: null, w: 3, h: 6 },
            { name: 'State Highway If \'Data\' 0-1 = 0; 1-3 = 1; <3 = 2', d: '0', yn: null, w: 2, h: 4 }
          ]},
          { cat: 'HH w/o Vehicle', rows: [
            { name: 'HH w/o Vehicle', d: '0.0%', yn: null, w: 3, h: 9 }
          ]},
          { cat: 'Average commute time', rows: [
            { name: 'Average commute time', d: '0', yn: null, w: 3, h: 12 }
          ]},
          { cat: 'Public transportation options', rows: [
            { name: 'Airport', d: '0', yn: 2, w: 4, h: 4 },
            { name: 'Train', d: '0', yn: null, w: 4, h: 4 },
            { name: 'Rapid Bus Transit', d: '0', yn: null, w: 4, h: 4 },
            { name: 'City Bus', d: '0', yn: 3, w: 3, h: 3 },
            { name: 'Trolley/Other', d: '0', yn: 1, w: 2, h: 2 },
            { name: 'Local Rideshare/Micro Transit', d: '0', yn: null, w: 2, h: 2 }
          ]},
          { cat: 'State transportation funds (# of funded or scheduled STIP projects)', rows: [
            { name: 'State transportation funds (# of funded or scheduled STIP projects)', d: '0', yn: null, w: 4, h: 8 }
          ]},
          { cat: 'Bike and Ped Plan', rows: [
            { name: 'Bike and Ped Plan', d: '0', yn: 1, w: 3, h: 3 }
          ]}
        ];
      } else if (name === "Arts & Culture") {
        specificRows = [
          { cat: 'Public Art installations', rows: [
            { name: 'Public Art If none = 0; 1-5 = 1 ; >5 = 2', d: '0', yn: null, w: 3, h: 6 },
            { name: 'Murals If none = 0; 1-5 = 1 ; >5 = 2', d: '0', yn: null, w: 2, h: 4 }
          ]},
          { cat: 'Public Art Map', rows: [
            { name: 'Public Art Map', d: '0', yn: 1, w: 2, h: 2 }
          ]},
          { cat: 'Cultural facilities (Theatre, museum, art, music)', rows: [
            { name: 'Arts/Community Center', d: '0', yn: 1, w: 2, h: 2 },
            { name: 'Museum', d: '0', yn: 1, w: 2, h: 2 },
            { name: 'Theatre', d: '0', yn: 1, w: 2, h: 2 },
            { name: 'Event Venues', d: '0', yn: 1, w: 2, h: 2 }
          ]},
          { cat: 'Event Programs (Festivals etc)', rows: [
            { name: 'Event Programs (Festivals etc)', d: '0', yn: null, w: 4, h: 12 }
          ]},
          { cat: '% of employment in Arts, Entertainment Sector', rows: [
            { name: '% of employment in Arts, Entertainment Sector*', d: '0.0%', yn: null, w: 4, h: 8 }
          ]}
        ];
      } else if (name === "Crime & Public Safety") {
        specificRows = [
          { cat: 'Personal Crime Index', rows: [
            { name: 'Personal Crime Index', d: '0', yn: null, w: 4, h: 16 }
          ]},
          { cat: 'Property Crime Index < 100', rows: [
            { name: 'Property Crime Index < 100', d: '0', yn: null, w: 3, h: 12 }
          ]},
          { cat: 'Bonus: Officer to Resident Ratio', rows: [
            { name: 'Bonus: Officer to Resident Ratio', d: '0', yn: 1, w: 2, h: 2 }
          ]}
        ];
      } else if (name === "Education") {
        specificRows = [
          { cat: 'HS Graduation', rows: [
            { name: 'HS Graduation', d: '0', yn: null, w: 2, h: 2 }
          ]},
          { cat: 'College', rows: [
            { name: 'Some college, no degree', d: '0', yn: null, w: 2, h: 2 },
            { name: 'Associates Degree', d: '0', yn: null, w: 3, h: 3 },
            { name: 'Bachelor Degree', d: '0', yn: null, w: 4, h: 4 },
            { name: 'Graduate/PhD', d: '0', yn: null, w: 4, h: 4 }
          ]},
          { cat: 'K-12 Performance (Low Performing Schools)', rows: [
            { name: 'K-12 Performance (Low Performing Schools)', d: '0', yn: null, w: 4, h: 16 }
          ]},
          { cat: 'K-12 Chronic Absentism', rows: [
            { name: 'K-12 Chronic Absentism', d: '0', yn: null, w: 3, h: 12 }
          ]},
          { cat: 'Secondary Education', rows: [
            { name: 'Community College/Trade School', d: '0', yn: null, w: 3, h: 6 },
            { name: 'College/Universities', d: '0', yn: null, w: 4, h: 8 }
          ]}
        ];
      } else if (name === "Employment & Labor") {
        specificRows = [
          { cat: '% White Collar Employed', rows: [{ name: '% White Collar Employed', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: '% Blue Collar Employed', rows: [{ name: '% Blue Collar Employed', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: '% Services Employed', rows: [{ name: '% Services Employed', d: '0.0%', yn: null, w: 2, h: 4 }] },
          { cat: 'Unemployment Rate', rows: [{ name: 'Unemployment Rate*', d: '0.0%', yn: null, w: 3, h: 9 }] },
          { cat: 'Labor Participation', rows: [{ name: 'Labor Participation', d: '0.0%', yn: null, w: 4, h: 16 }] },
          { cat: 'Average HH Income', rows: [{ name: 'Average HH Income', d: '$0', yn: null, w: 2, h: 8 }] },
          { cat: 'Median HH Income', rows: [{ name: 'Median HH Income', d: '$0', yn: null, w: 3, h: 12 }] },
          { cat: 'Per Capita Income', rows: [{ name: 'Per Capita Income', d: '$0', yn: null, w: 3, h: 12 }] },
          { cat: 'Certified Pad Ready Sites', rows: [{ name: 'Certified Pad Ready Sites', d: '0', yn: null, w: 3, h: 6 }] },
          { cat: 'Available buildings > 5000 SF', rows: [{ name: 'Available buildings > 5000 SF', d: '0', yn: null, w: 2, h: 4 }] },
          { cat: 'Large Employers', rows: [{ name: '500+ Employee Businesses', d: '0', yn: null, w: 3, h: 12 }, { name: '1000+ Employee Businesses', d: '0', yn: null, w: 4, h: 16 }] },
          { cat: 'BONUS: HQ/Fortune 500/100', rows: [{ name: 'BONUS: HQ/Fortune 500/100', d: '0', yn: 1, w: 4, h: 4 }] }
        ];
      } else if (name === "Goods & Services") {
        specificRows = [
          { cat: '% Employed in Retail Trade', rows: [{ name: '% Employed in Retail Trade', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: '% Employed in Accommodations & Food Services', rows: [{ name: '% Employed in Accommodations & Food Services', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: '% Employed in Arts, Entertainment & Recreation', rows: [{ name: '% Employed in Arts, Entertainment & Recreation', d: '0.0%', yn: null, w: 2, h: 4 }] },
          { cat: 'Retail Vacancy', rows: [{ name: 'Retail Vacancy', d: '0.0%', yn: null, w: 4, h: 16 }] }
        ];
      } else if (name === "Healthcare & Wellness") {
        specificRows = [
          { cat: 'Hospitals', rows: [{ name: 'US is 2.9 beds per 1,000 persons', d: '0', yn: null, w: 4, h: 4 }] },
          { cat: 'Clinics, Medical Facilities', rows: [{ name: 'Clinics, Medical Facilities', d: '0', yn: null, w: 3, h: 6 }] },
          { cat: 'County Health Factors', rows: [{ name: 'County Health Factors', d: '0', yn: null, w: 3, h: 12 }] },
          { cat: 'Air Quality Index', rows: [{ name: 'Air Quality Index', d: '0', yn: null, w: 2, h: 8 }] },
          { cat: 'Households Below Poverty Level', rows: [{ name: 'Households Below Poverty Level (ACS 5 Year - 2021)', d: '0.0%', yn: null, w: 4, h: 16 }] },
          { cat: 'Access to Healthy Food', rows: [{ name: 'Access to Healthy Food', d: '0', yn: null, w: 3, h: 6 }] },
          { cat: '% Employed in Healthcare Sector', rows: [{ name: '% Employed in Healthcare Sector', d: '0.0%', yn: null, w: 3, h: 6 }] }
        ];
      } else if (name === "Historic Preservation") {
        specificRows = [
          { cat: 'Historic Districts', rows: [{ name: 'Historic Districts', d: '0', yn: null, w: 3, h: 6 }] },
          { cat: 'Main St. Designation', rows: [{ name: 'Main St. Designation', d: '0', yn: 1, w: 3, h: 3 }] },
          { cat: 'Downtown or Main St. Manager', rows: [{ name: 'Downtown or Main St. Manager', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Registered Buildings', rows: [{ name: 'Registered Buildings', d: '0', yn: null, w: 1, h: 2 }] },
          { cat: 'Municipal Service or Business Improvement District', rows: [{ name: 'Municipal Service or Business Improvement District', d: '0', yn: null, w: 1, h: 2 }] },
          { cat: 'Historic Tour Map', rows: [{ name: 'Historic Tour Map', d: '0', yn: 1, w: 2, h: 2 }] }
        ];
      } else if (name === "Housing") {
        specificRows = [
          { cat: 'Housing Units Renter Occupied', rows: [{ name: 'Housing Units Renter Occupied', d: '0.0%', yn: null, w: 3, h: 12 }] },
          { cat: 'Median Home Value', rows: [{ name: 'Median Home Value', d: '$0', yn: null, w: 3, h: 12 }] },
          { cat: '*Median Rent Price', rows: [{ name: '*Median Rent Price', d: '$0', yn: null, w: 3, h: 12 }] },
          { cat: 'Housing Structure Year Built', rows: [{ name: 'Housing Structure Year Built', d: '0.0%', yn: null, w: 3, h: 12 }] },
          { cat: 'Cost Burdened Households', rows: [{ name: 'Cost Burdened Households', d: '0.0%', yn: null, w: 4, h: 12 }] },
          { cat: 'BONUS: Diversity Index', rows: [{ name: 'BONUS: Diversity Index', d: '0', yn: null, w: 3, h: 3 }] }
        ];
      } else if (name === "Infrastructure") {
        specificRows = [
          { cat: 'Public Sewer Capacity', rows: [{ name: 'Public Sewer Capacity', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Public Water Capacity', rows: [{ name: 'Public Water Capacity', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Public Electric Capacity', rows: [{ name: 'Public Electric Capacity', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Broadband Availibility', rows: [{ name: 'Broadband Availibility', d: '0', yn: null, w: 2, h: 8 }] },
          { cat: 'Expansion Plans', rows: [{ name: 'Expansion Plans', d: '0', yn: 1, w: 3, h: 3 }] },
          { cat: 'Roadways (STIP)', rows: [{ name: 'Roadways (STIP)', d: '0', yn: null, w: 1, h: 4 }] },
          { cat: 'Water Quality (Stormwater)', rows: [{ name: 'Water Quality (Stormwater)', d: '0', yn: null, w: 2, h: 8 }] },
          { cat: 'Emergency Planning', rows: [{ name: 'Emergency Planning', d: '0', yn: 1, w: 1, h: 1 }] },
          { cat: 'BONUS: Green Energy Alternatives', rows: [{ name: 'BONUS: Green Energy Alternatives', d: '0', yn: 1, w: 3, h: 3 }] }
        ];
      } else if (name === "Open Space & Recreation") {
        specificRows = [
          { cat: 'Recreation Plan', rows: [{ name: 'Recreation Plan', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Parks and Rec Director', rows: [{ name: 'Parks and Rec Director', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'Greenway', rows: [{ name: 'Greenway', d: '0', yn: null, w: 3, h: 9 }] },
          { cat: 'Natural/Recreational Assets', rows: [{ name: 'Natural/Recreational Assets', d: '0', yn: null, w: 2, h: 6 }] },
          { cat: 'Open Space/Parks', rows: [{ name: 'Open Space/Parks', d: '0', yn: null, w: 3, h: 9 }] },
          { cat: 'Conservation Ordinances', rows: [{ name: 'Conservation Ordinances', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: 'BONUS: National (2) or State Park (1)', rows: [{ name: 'BONUS: National (2) or State Park (1)', d: '0', yn: null, w: 3, h: 3 }] }
        ];
      } else if (name === "Planning & Land Use") {
        specificRows = [
          { cat: 'Voluntary Agricultural Districts (VAD) or (EVAD)', rows: [{ name: 'Voluntary Agricultural Districts (VAD) or (EVAD)', d: '0', yn: 1, w: 2, h: 2 }] },
          { cat: '% Agricultural Employment Sector', rows: [{ name: '% Agricultural Employment Sector', d: '0.0%', yn: null, w: 2, h: 4 }] },
          { cat: '% Residential Property Tax Value', rows: [{ name: '% Residential Property Tax Value', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: '% Commercial Property Tax Value', rows: [{ name: '% Commercial Property Tax Value', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: 'Vacant Land (acres)', rows: [{ name: 'Vacant Land (acres)', d: '0.0%', yn: null, w: 3, h: 6 }] },
          { cat: 'Tax Exempt Acreage', rows: [{ name: 'Tax Exempt Acreage (institutions, churches, schools)', d: '0', yn: null, w: 2, h: 4 }] },
          { cat: 'Comprehensive Land Use Plan', rows: [{ name: 'Comprehensive Land Use Plan', d: 'Y (2018)', yn: null, w: 4, h: 12 }] }
        ];
      }

      const categories: any[] = [];

      if (specificRows) {
        for (let cIdx = 0; cIdx < specificRows.length; cIdx++) {
          const catObj = specificRows[cIdx];
          const category = await this.categoryModel.create(
            { sectionId: section.id, label: catObj.cat, takesValues: false },
            { transaction },
          );

          // Create the exact 7 columns attached to THIS category with exact scoringRules from seed.ts
          const cols = await this.columnModel.bulkCreate(
            [
              { categoryId: category.id, name: 'Y(1)/N(0)', type: ColumnType.NUMBER, validationMin: 0, validationMax: 1, scoringRule: { kind: 'manual', maxPoints: 1 } },
              { categoryId: category.id, name: 'Weight (1-4)', type: ColumnType.NUMBER, validationMin: 1, validationMax: 4, scoringRule: { kind: 'manual', maxPoints: 4 } },
              { categoryId: category.id, name: 'Value', type: ColumnType.NUMBER, validationMin: 0, validationMax: 10, scoringRule: { kind: 'manual', maxPoints: 10 } },
              { categoryId: category.id, name: 'Client Total Score', type: ColumnType.NUMBER, validationMin: 0, validationMax: 100, scoringRule: { kind: 'manual', maxPoints: 10 } },
              { categoryId: category.id, name: 'Highest Score', type: ColumnType.NUMBER, validationMin: 0, validationMax: 100, scoringRule: { kind: 'manual', maxPoints: 10 } },
              { categoryId: category.id, name: 'Overall Trend', type: ColumnType.NUMBER, validationMin: 0, validationMax: 20, scoringRule: { kind: 'manual', maxPoints: 0 } },
              { categoryId: category.id, name: 'Local Data Result & Notes', type: ColumnType.TEXT, validationMin: null, validationMax: null, scoringRule: { kind: 'manual', maxPoints: 0 } },
            ],
            { transaction },
          );

          const columns = cols.map((c) => c.toJSON());

          const createdGroups: any[] = [];
          for (let rIdx = 0; rIdx < catObj.rows.length; rIdx++) {
            const r = catObj.rows[rIdx];
            const group = await this.groupModel.create(
              { categoryId: category.id, label: r.name, takesValues: false },
              { transaction },
            );
            createdGroups.push(group.toJSON());

            const isYn = r.yn !== null;
            const maxValAllowed = Math.max(1, r.h / r.w);
            const randYn = Math.random() > 0.2 ? 1 : 0;
            const baseVal = Math.random();
            const randVal = Math.min(maxValAllowed, Math.max(1, Math.floor(baseVal * maxValAllowed * 0.6 + maxValAllowed * 0.4)));
            const rawClientTotal = isYn ? (randYn * r.w) : (randVal * r.w);
            const randClientTotal = Math.min(10, rawClientTotal);
            const randHighest = Math.min(10, Math.max(randClientTotal, Math.floor(Math.random() * 11)));
            const dataBaseValue = Math.floor(Math.random() * 101);
            const trendVal = Math.floor(5 + (randClientTotal * 0.5) + (Math.random() * 2));

            sampleRecords.push({ nodeId: group.id, columnId: '__base__', value: dataBaseValue, source: 'City Planning Dept 2026' });
            sampleRecords.push({ nodeId: group.id, columnId: cols[0].id, value: isYn ? randYn : null });
            sampleRecords.push({ nodeId: group.id, columnId: cols[1].id, value: r.w });
            sampleRecords.push({ nodeId: group.id, columnId: cols[2].id, value: randVal });
            sampleRecords.push({ nodeId: group.id, columnId: cols[3].id, value: randClientTotal });
            sampleRecords.push({ nodeId: group.id, columnId: cols[4].id, value: randHighest });
            sampleRecords.push({ nodeId: group.id, columnId: cols[5].id, value: trendVal });
            sampleRecords.push({ nodeId: group.id, columnId: cols[6].id, value: 'Verified locally' });
          }

          categories.push({
            id: category.id,
            label: catObj.cat,
            takesValues: false,
            groups: createdGroups,
            columns,
          });
        }
      } else {
        const category = await this.categoryModel.create(
          { sectionId: section.id, label: 'Overview', takesValues: false },
          { transaction },
        );
        const subMetrics = subMetricsMapping[name] || ['Sub-Category 1', 'Sub-Category 2', 'Sub-Category 3'];

        const cols = await this.columnModel.bulkCreate(
          [
            { categoryId: category.id, name: 'Y(1)/N(0)', type: ColumnType.NUMBER, validationMin: 0, validationMax: 1, scoringRule: { kind: 'manual', maxPoints: 1 } },
            { categoryId: category.id, name: 'Weight (1-4)', type: ColumnType.NUMBER, validationMin: 1, validationMax: 4, scoringRule: { kind: 'manual', maxPoints: 4 } },
            { categoryId: category.id, name: 'Value', type: ColumnType.NUMBER, validationMin: 0, validationMax: 10, scoringRule: { kind: 'manual', maxPoints: 10 } },
            { categoryId: category.id, name: 'Client Total Score', type: ColumnType.NUMBER, validationMin: 0, validationMax: 100, scoringRule: { kind: 'manual', maxPoints: 10 } },
            { categoryId: category.id, name: 'Highest Score', type: ColumnType.NUMBER, validationMin: 0, validationMax: 100, scoringRule: { kind: 'manual', maxPoints: 10 } },
            { categoryId: category.id, name: 'Overall Trend', type: ColumnType.NUMBER, validationMin: 0, validationMax: 20, scoringRule: { kind: 'manual', maxPoints: 0 } },
            { categoryId: category.id, name: 'Local Data Result & Notes', type: ColumnType.TEXT, validationMin: null, validationMax: null, scoringRule: { kind: 'manual', maxPoints: 0 } },
          ],
          { transaction },
        );

        const columns = cols.map((c) => c.toJSON());

        const createdGroups: any[] = [];
        for (const metricName of subMetrics) {
          const group = await this.groupModel.create(
            { categoryId: category.id, label: metricName, takesValues: false },
            { transaction },
          );
          createdGroups.push(group.toJSON());

          const dataVal = Math.floor(Math.random() * 101);
          const yn = Math.random() > 0.2 ? 1 : 0;
          const weight = Math.floor(Math.random() * 4) + 1;
          const val = Math.floor(Math.random() * 3 + 2);
          const highest = 10;
          const targetScore = 5.0 + Number((Math.random() * 2.0).toFixed(1));
          const clientTotal = Number(targetScore.toFixed(1));
          const trendVal = Math.floor(5 + (clientTotal * 0.5) + (Math.random() * 2));

          sampleRecords.push({ nodeId: group.id, columnId: '__base__', value: dataVal, source: 'City Planning Dept 2026' });
          sampleRecords.push({ nodeId: group.id, columnId: cols[0].id, value: yn });
          sampleRecords.push({ nodeId: group.id, columnId: cols[1].id, value: weight });
          sampleRecords.push({ nodeId: group.id, columnId: cols[2].id, value: val });
          sampleRecords.push({ nodeId: group.id, columnId: cols[3].id, value: clientTotal });
          sampleRecords.push({ nodeId: group.id, columnId: cols[4].id, value: highest });
          sampleRecords.push({ nodeId: group.id, columnId: cols[5].id, value: trendVal });
          sampleRecords.push({ nodeId: group.id, columnId: cols[6].id, value: 'Verified locally' });
        }

        categories.push({
          id: category.id,
          label: 'Overview',
          takesValues: false,
          groups: createdGroups,
          columns,
        });
      }

      const secJson = {
        id: section.id,
        label: name,
        categories,
      };
      sectionEntities.push(secJson);

      sectionIndex++;
    }

    const initialProjectsPool = [
      { name: "Metropolis Master Plan 2026", clientName: "City of Metropolis Planning Dept", year: 2026, status: ProjectStatus.PUBLISHED, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60" },
      { name: "Hudson Yards Vision 2026", clientName: "NYC Economic Development Corp", year: 2026, status: ProjectStatus.IN_REVIEW, image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=60" },
      { name: "Riverside Gateway Plan 2026", clientName: "Riverside Development Authority", year: 2026, status: ProjectStatus.CALCULATED, image: "https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?w=800&auto=format&fit=crop&q=60" },
      { name: "Midtown Tech District 2026", clientName: "Midtown Commerce Alliance", year: 2026, status: ProjectStatus.INGESTION_RUNNING, image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60" },
      { name: "Harbor View Revitalization 2026", clientName: "Harbor Port Authority", year: 2026, status: ProjectStatus.INTAKE_PENDING, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=60" },
      { name: "Beacon Hill Urban Core 2026", clientName: "Boston Urban Planning Board", year: 2026, status: ProjectStatus.PUBLISHED, image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=60" }
    ];

    for (let pIdx = 0; pIdx < initialProjectsPool.length; pIdx++) {
      const proj = initialProjectsPool[pIdx];
      const createdProject = await this.projectModel.create(
        {
          name: proj.name,
          clientName: proj.clientName,
          year: proj.year,
          status: proj.status,
          image: proj.image,
          assignedSections: sectionEntities,
          enabledWidgets: [],
          bypassPayments: true,
          totalProjectValue: 5000.00,
        },
        { transaction },
      );

      // Seed 3-tier milestone payments with current bypass
      await this.milestoneModel.bulkCreate([
        {
          projectId: createdProject.id,
          milestoneType: MilestoneType.INITIAL_40,
          amountDue: 2000.00,
          percentage: 40,
          status: PaymentStatus.BYPASSED,
          paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
          provider: 'MANUAL',
          transactionReference: `INIT-${createdProject.id.slice(0, 6)}`,
          clearedAt: new Date(),
        },
        {
          projectId: createdProject.id,
          milestoneType: MilestoneType.MID_30,
          amountDue: 1500.00,
          percentage: 30,
          status: proj.status === ProjectStatus.INTAKE_PENDING ? PaymentStatus.PENDING : PaymentStatus.BYPASSED,
          paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
          provider: 'MANUAL',
          clearedAt: proj.status === ProjectStatus.INTAKE_PENDING ? null : new Date(),
        },
        {
          projectId: createdProject.id,
          milestoneType: MilestoneType.FINAL_30,
          amountDue: 1500.00,
          percentage: 30,
          status: proj.status === ProjectStatus.PUBLISHED ? PaymentStatus.BYPASSED : PaymentStatus.PENDING,
          paymentMethod: 'ACH Direct Debit (Stripe/HubSpot)',
          provider: 'MANUAL',
          clearedAt: proj.status === ProjectStatus.PUBLISHED ? new Date() : null,
        },
      ], { transaction });

      // Seed questionnaire
      await this.questionnaireModel.create({
        projectId: createdProject.id,
        status: proj.status === ProjectStatus.INTAKE_PENDING ? QuestionnaireStatus.DRAFT : QuestionnaireStatus.SUBMITTED,
        completedPointsCount: proj.status === ProjectStatus.INTAKE_PENDING ? 24 : 92,
        totalPointsCount: 92,
        answersPayload: {
          transit_airport_count: { value: 2 },
          transit_city_bus_count: { value: 6 },
          safety_municipal_officers_count: { value: 45 },
          edu_comm_college_count: { value: 1 },
          labor_fortune_500_hq: { value: false },
        },
        submittedAt: proj.status === ProjectStatus.INTAKE_PENDING ? null : new Date(),
      }, { transaction });

      // Seed scorecard rollup matching Speedometer Master bands
      const categoryScores = sectionNames.map((sName, sIdx) => {
        const scoreTenScale = Number((5.8 + ((sIdx * 0.45) % 3.4)).toFixed(1));
        return {
          categoryKey: sName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          categoryLabel: sName,
          totalClientPoints: Math.round(scoreTenScale * 6.5),
          totalMaxPoints: 65,
          scorePercentage: Number((scoreTenScale * 10).toFixed(1)),
          scoreTenScale,
          rank: sIdx + 1,
          metricsCount: 6,
        };
      });

      const avgTenScale = Number((categoryScores.reduce((s, c) => s + c.scoreTenScale, 0) / 12).toFixed(1));
      await this.rollupModel.create({
        projectId: createdProject.id,
        overallScoreTenScale: avgTenScale,
        overallScorePercentage: Number((avgTenScale * 10).toFixed(1)),
        performanceBand: avgTenScale > 7.0 ? 'Good' : 'Average',
        categoryScores,
        isCalibrated: proj.status === ProjectStatus.PUBLISHED,
        calibrationNotes: proj.status === ProjectStatus.PUBLISHED ? 'Calibrated by Lead Analyst Kathleen Rose' : null,
      }, { transaction });

      // Bulk create realistic data records with slight variations per project
      const projectRecords = sampleRecords.map((r) => {
        let val = r.value;
        if (typeof val === 'number' && r.columnId !== '__base__') {
          const factor = 0.85 + (pIdx * 0.05) + (Math.random() * 0.1);
          val = Number((val * factor).toFixed(1));
        }
        return {
          projectId: createdProject.id,
          nodeId: r.nodeId,
          columnId: r.columnId,
          value: val,
          source: r.source,
          notes: r.notes,
        };
      });

      await this.recordModel.bulkCreate(projectRecords, { transaction });
    }

    this.logger.log(`Seeded ${initialProjectsPool.length} realistic initial sample projects!`);
  }

  private async seedAdditionalSampleProject(transaction: any) {
    const existingProjects = await this.projectModel.findAll({ transaction });
    const existingNames = new Set(existingProjects.map((p) => p.name));

    const sampleProjectPool = [
      { name: "Metropolis Master Plan 2026", clientName: "City of Metropolis Planning Dept", year: 2026, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60" },
      { name: "Hudson Yards Vision 2026", clientName: "NYC Economic Development Corp", year: 2026, image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=60" },
      { name: "Riverside Gateway Plan 2026", clientName: "Riverside Development Authority", year: 2026, image: "https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?w=800&auto=format&fit=crop&q=60" },
      { name: "Midtown Tech District 2026", clientName: "Midtown Commerce Alliance", year: 2026, image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=60" },
      { name: "Harbor View Revitalization 2026", clientName: "Harbor Port Authority", year: 2026, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=60" },
      { name: "Beacon Hill Urban Core 2026", clientName: "Boston Urban Planning Board", year: 2026, image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=60" },
      { name: "Oakland Civic Hub 2026", clientName: "Oakland Redevelopment Agency", year: 2026, image: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&auto=format&fit=crop&q=60" },
      { name: "Downtown Mobility Core 2026", clientName: "Department of Transit & Mobility", year: 2026, image: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=800&auto=format&fit=crop&q=60" },
      { name: "Highland Park Master Plan 2027", clientName: "Highland Community Development", year: 2027, image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop&q=60" },
      { name: "Grand Avenue Renewal 2027", clientName: "Grand Avenue Commerce Group", year: 2027, image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop&q=60" },
      { name: "Waterfront Esplanade 2027", clientName: "Waterfront Development Commission", year: 2027, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60" },
      { name: "Silicon Corridor Hub 2027", clientName: "Silicon Valley Urban Alliance", year: 2027, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60" },
      { name: "Bayview Heights Vision 2027", clientName: "Bayview District Planning Auth", year: 2027, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60" },
      { name: "Capitol Square District 2028", clientName: "Capitol City Planning Council", year: 2028, image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop&q=60" },
      { name: "Sunset Boulevard Project 2028", clientName: "Sunset Redevelopment Agency", year: 2028, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60" }
    ];

    let selectedProject = sampleProjectPool.find((p) => !existingNames.has(p.name));

    if (!selectedProject) {
      const projectNames = [
        'Pacific Heights Development',
        'Emerald Bay Master Plan',
        'Central Park Transit Corridor',
        'Eastside Innovation Quarter',
        'Olympic Legacy Promenade',
        'Greenwich Green District',
        'Northgate Civic Plaza',
        'South End Heritage District'
      ];
      const clientNames = [
        'Pacific Heights Urban Auth',
        'Emerald Bay Development Corp',
        'Central Park Transit Board',
        'Eastside Growth Alliance',
        'Olympic Legacy Trust',
        'Greenwich Mobility Council',
        'Northgate Regional Agency',
        'South End Heritage Foundation'
      ];
      let count = existingProjects.length + 1;
      const pIndex = (count - 1) % projectNames.length;
      const cIndex = (count - 1) % clientNames.length;
      let uniqueName = `${projectNames[pIndex]} (${count})`;
      while (existingNames.has(uniqueName)) {
        count++;
        uniqueName = `${projectNames[pIndex]} (${count})`;
      }
      selectedProject = {
        name: uniqueName,
        clientName: `${clientNames[cIndex]}`,
        year: 2026 + (count % 3),
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60"
      };
    }

    const sections = await this.sectionModel.findAll({
      include: [
        {
          model: TemplateCategory,
          as: 'categories',
          include: [{ model: TemplateGroup, as: 'groups' }, { model: TemplateColumn, as: 'columns' }],
        },
      ],
      transaction,
    });

    const sectionEntities = sections.map((s) => JSON.parse(JSON.stringify(s.toJSON())));

    const sampleProject = await this.projectModel.create(
      {
        name: selectedProject.name,
        clientName: selectedProject.clientName,
        year: selectedProject.year,
        status: ProjectStatus.INTAKE_PENDING,
        image: selectedProject.image,
        assignedSections: sectionEntities,
        enabledWidgets: [],
        bypassPayments: true,
        totalProjectValue: 5000.00,
      },
      { transaction },
    );

    // Populate data records matching frontend seed logic
    const recordsToInsert: any[] = [];
    const notesPool = [
      'Verified by Municipal Planning Board (2026)',
      'GIS Mapping Survey Confirmed',
      'Local Infrastructure Audit Approved',
      'Census Data Cross-Referenced',
      'Environmental Impact Assessment Passed'
    ];

    for (const sec of sections) {
      for (const cat of sec.categories || []) {
        for (const group of cat.groups || []) {
          recordsToInsert.push({ projectId: sampleProject.id, nodeId: group.id, columnId: '__base__', value: Math.floor(Math.random() * 101), source: 'City Planning Dept 2026' });
          for (const col of cat.columns || []) {
            let val: any = 0;
            if (col.name === 'Y(1)/N(0)') val = Math.random() > 0.2 ? 1 : 0;
            else if (col.name === 'Weight (1-4)') val = Math.floor(Math.random() * 4) + 1;
            else if (col.name === 'Value') val = Math.floor(Math.random() * 3) + 2;
            else if (col.name === 'Client Total Score') val = Number((5.5 + Math.random() * 3.5).toFixed(1));
            else if (col.name === 'Highest Score') val = 10;
            else if (col.name === 'Overall Trend') val = Math.floor(Math.random() * 8) + 10;
            else val = notesPool[Math.floor(Math.random() * notesPool.length)];

            recordsToInsert.push({ projectId: sampleProject.id, nodeId: group.id, columnId: col.id, value: val });
          }
        }
      }
    }

    if (recordsToInsert.length > 0) {
      await this.recordModel.bulkCreate(recordsToInsert, { transaction });
    }

    this.logger.log(`Created additional sample project: ${selectedProject.name}`);
  }
}
