import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';

@Controller(['api/v1/intake', 'intake'])
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get('definition')
  getDefinition() {
    return this.questionnaireService.getQuestionnaireDefinition();
  }

  @Get('project/:projectId')
  async getSubmission(@Param('projectId') projectId: string) {
    return this.questionnaireService.getSubmission(projectId);
  }

  @Post('project/:projectId/draft')
  async saveDraft(
    @Param('projectId') projectId: string,
    @Body('answers') answers: Record<string, any>,
  ) {
    return this.questionnaireService.saveDraft(projectId, answers || {});
  }

  @Post('project/:projectId/submit')
  async submitQuestionnaire(
    @Param('projectId') projectId: string,
    @Body('answers') answers: Record<string, any>,
  ) {
    return this.questionnaireService.submitQuestionnaire(projectId, answers);
  }
}
