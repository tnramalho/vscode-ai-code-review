import { Injectable } from '@nestjs/common';
import { AI_PROMPT, Client, HUMAN_PROMPT } from '@anthropic-ai/sdk';

@Injectable()
export class ClaudeApiService {
  private client: Client;
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('The CLAUDE_API_KEY environment variable must be set');
    }
    this.client = new Client(apiKey);
  }

  getContext(codeContext: string, prompt: string): string {
    const PROMPT_SIMPLE = `
      Please review the code and provide comments about on 
      code quality, readability, and best practices.
      and give a score for each category :
      here is the code context: ${codeContext}
    `;

    const PROMPT_EXPERT = `
      Act as a expect react Developer in code reviewer with a deep knowledge in react best practices hooks 
      development, 
      Please review the code for pull request and provide snippet with improvement on code quality, readability, and best practices.
      encode any html tag from response, no introduction need to be provided
      only provide snippet code that could be replaced for the code sent
      and also provide the line of the code it was supposed to be replaced
      : ${codeContext}
    `;

    const PROMPT_EXPERT_CANDIDATE = `
      Act as a expect react Developer in code reviewer with a deep knowledge in react best practices hooks 
      development, 
      Please review the code for pull request and provide comments about on code quality, readability, and best practices.
      Use a friendly language, give me suggestions of how to improve my code. 
      Please provider a score for each topic fo that link used for the repository
      give this context please provide feedback in the following github repository:
    `;

    const PROMPT_LINK = `Please review the code for ${prompt} and provide feedback on code quality, readability, 
      and best practices. Use a friendly language, give me code Snippets of how to improve my code.`;

    const PROMPT_LIST_REVIEW = `
      behavior as a senior developer
      follow this points to do a code review
      - follow main programming good practices principles:
      - DRY (Don't repeat yourself)
      - KISS (Keep it simple, stupid)
      - YAGNI (You aren't gonna need it)
      - SOLID (Single responsibility, Open-closed, Liskov substitution, Interface segregation and Dependency inversion)
      - Avoid code smells
      - Avoid anti-patterns
      - Avoid bad practices
      - Avoid bad design patterns
      - Avoid bad architecture
      - Avoid bad code
      - Avoid bad naming
      - Avoid bad comments
      - Avoid bad formatting
      - Make sure the code Executes without any bug
  
      Only make comments on what is wrong.
      please provider the filed name and line of each comment
      Here is de code:
    `;

    const PROMPT_SNIPPET = `Please do a code review in the following react code snippet and provide 
    suggestion of implementation based on code quality, 
    readability, and best practices. the reply should only contains the suggestions it self, with no 
    introduction or explanation of the code, only snippets of code. where the snippet will be separated 
    by a string [SNIPPET]`;

    const PROMPT_EXPERT_CODE = `
      Act as a expert react Developer in code reviewer with a deep knowledge in react best practices hooks development
      With the goal to help devs as a pair programming partner, finding any possible bugs, and providing suggestions of how to improve the code. 
      Consider only the following code is the scope of to be reviewed: ${codeContext}
      Based on that scope Please review the code and provide snippet code about on code quality, readability, 
      and best practices that is not being used that could improve the code. 
      Show most important snippets with short comments about the code
      encode any html tag that may be returned in the claude api response. 
      Display the snippets into a code block box html for each snippet separated by borders

      
      
    `;

    const listPrompts = [
      PROMPT_SIMPLE, // 0
      PROMPT_EXPERT, // 1
      PROMPT_EXPERT_CANDIDATE, // 2
      PROMPT_LINK, // 3
      PROMPT_LIST_REVIEW, // 4
      PROMPT_SNIPPET, // 5
      PROMPT_EXPERT_CODE, // 6
    ];
    return listPrompts[6];
  }

  async codeReview(
    codeAsContext: string,
    codeToReview: string
  ): Promise<string> {
    console.log('inside code review');
    const context = await this.getContext(codeAsContext, codeToReview);

    const prompt = `${HUMAN_PROMPT}: ${context} ${AI_PROMPT}`;

    console.log(`${context}: ${codeToReview} `);
    const response = await this.client.complete({
      prompt: prompt,
      stop_sequences: [HUMAN_PROMPT],
      max_tokens_to_sample: 10000,
      //model: 'claude-v1',
      model: 'claude-v1.3-100k',
    });

    console.log('response', response.completion);

    return response.completion;
  }
}
