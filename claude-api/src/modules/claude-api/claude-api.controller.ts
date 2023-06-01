import { Body, Controller, Post } from '@nestjs/common';
import { ClaudeApiService } from './claude-api.service';

@Controller('claude-api/')
export class ClaudeApiController {
  constructor(private readonly claudeApiService: ClaudeApiService) {}

  @Post('code-review')
  async codeReview(
    @Body('codeAsContext') codeAsContext: string,
    @Body('codeToReview') codeToReview: string
  ) {
    return await this.claudeApiService.codeReview(codeAsContext, codeToReview);
  }
}
