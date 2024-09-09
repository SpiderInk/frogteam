import * as vscode from 'vscode';
import { output_log } from '../utils/outputChannelManager';
import { MLflowClient } from './client';
import { Prompt } from '../utils/prompts';

export class PromptExperiment {
  private client: MLflowClient;

  constructor(mlflowServerUrl: string) {
    this.client = new MLflowClient(mlflowServerUrl);
  }

  async createExperiment(name: string): Promise<string> {
    try {
      const response = await this.client.createExperiment(name);
      return response.experiment_id;
    } catch (error) {
      vscode.window.showErrorMessage(`PromptExperiment.createExperiment: Error creating experiment: ${error}.`);
      output_log(`PromptExperiment.createExperiment: Error creating experiment: ${error}.`);
      return "-1";
    }
  }

  async startRunAndLogPrompt(prompt: Prompt): Promise<string> {
    try {
      if(prompt.ml_experiment_id) {
          const run = await this.client.createRun(prompt.ml_experiment_id);
          const runId = run.run.info.run_id;
          // Log all prompt details as parameters
          await this.client.logParam(runId, 'prompt_id', prompt.id);
          await this.client.logParam(runId, 'prompt_name', `${prompt.models}-${prompt.role}`);
          await this.client.logParam(runId, 'prompt_description', prompt.category);
          await this.client.logParam(runId, 'prompt_text', prompt.content);
          await this.client.logParam(runId, 'model', prompt.models);
          await this.client.logParam(runId, 'temperature', "1");
          await this.client.logParam(runId, 'max_tokens', "-1");
          return runId;
      } else {
        return "-1";
      }
    } catch (error) {
      vscode.window.showErrorMessage(`PromptExperiment.startRunAndLogPrompt Error starting run and logging prompt: ${error}.`);
      output_log(`PromptExperiment.startRunAndLogPrompt Error starting run and logging prompt: ${error}.`);
      return "-1";
    }
  }

  async endRunAndLogPromptResult(runId: string, result: string, duration: number): Promise<void> {
    try {
      if(runId !== "-1") {
        await this.client.logMetric(runId, 'result_length', result.length);
        await this.client.logParam(runId, 'result', result);
        await this.client.logMetric(runId, 'duration', duration);
        await this.client.updateRun(runId, 'FINISHED');
      }
    } catch (error) {
      vscode.window.showErrorMessage(`PromptExperiment.endRunAndLogPromptResult Error logging prompt result: ${error}.`);
      output_log(`PromptExperiment.endRunAndLogPromptResult Error logging prompt result: ${error}.`);
    }
  }
}