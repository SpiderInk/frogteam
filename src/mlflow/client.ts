import { v4 as uuidv4 } from 'uuid';

/**
 * MLflowClient class for interacting with the MLflow REST API
 */
export class MLflowClient {
  private baseUrl: string;

  /**
   * Constructor for MLflowClient
   * @param baseUrl The base URL of the MLflow server
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Make a request to the MLflow API
   * @param endpoint The API endpoint
   * @param method The HTTP method
   * @param body The request body (optional)
   * @returns The response data
   */
  private async request(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error making request to MLflow API:', error);
      throw error;
    }
  }

  /**
   * Create a new experiment
   * @param name The name of the experiment
   * @returns The created experiment
   */
  async createExperiment(name: string): Promise<any> {
    return this.request('/api/2.0/mlflow/experiments/create', 'POST', { name });
  }

  /**
   * Get an experiment by ID
   * @param experimentId The ID of the experiment
   * @returns The experiment details
   */
  async getExperiment(experimentId: string): Promise<any> {
    return this.request(`/api/2.0/mlflow/experiments/get?experiment_id=${experimentId}`, 'GET');
  }

  /**
   * Create a new run
   * @param experimentId The ID of the experiment
   * @returns The created run
   */
  async createRun(experimentId: string): Promise<any> {
    const body = {
      experiment_id: experimentId,
      start_time: Date.now(),
      tags: [
        { key: 'mlflow.source.name', value: 'MLflowClient' },
        { key: 'mlflow.source.type', value: 'LOCAL' },
        { key: 'mlflow.user', value: 'MLflowClient' },
      ],
    };
    return this.request('/api/2.0/mlflow/runs/create', 'POST', body);
  }

  /**
   * Log a parameter for a run
   * @param runId The ID of the run
   * @param key The parameter key
   * @param value The parameter value
   * @returns The response from the API
   */
  async logParam(runId: string, key: string, value: string): Promise<any> {
    const body = { run_id: runId, key, value };
    return this.request('/api/2.0/mlflow/runs/log-parameter', 'POST', body);
  }

  /**
   * Log a metric for a run
   * @param runId The ID of the run
   * @param key The metric key
   * @param value The metric value
   * @param timestamp The timestamp of the metric (optional)
   * @param step The step of the metric (optional)
   * @returns The response from the API
   */
  async logMetric(runId: string, key: string, value: number, timestamp?: number, step?: number): Promise<any> {
    const body = {
      run_id: runId,
      key,
      value,
      timestamp: timestamp || Date.now(),
      step: step || 0,
    };
    return this.request('/api/2.0/mlflow/runs/log-metric', 'POST', body);
  }

  /**
   * Set a tag for a run
   * @param runId The ID of the run
   * @param key The tag key
   * @param value The tag value
   * @returns The response from the API
   */
  async setTag(runId: string, key: string, value: string): Promise<any> {
    const body = { run_id: runId, key, value };
    return this.request('/api/2.0/mlflow/runs/set-tag', 'POST', body);
  }

  /**
   * Update a run
   * @param runId The ID of the run
   * @param status The new status of the run
   * @param endTime The end time of the run (optional)
   * @returns The updated run
   */
  async updateRun(runId: string, status: 'RUNNING' | 'SCHEDULED' | 'FINISHED' | 'FAILED' | 'KILLED', endTime?: number): Promise<any> {
    const body = {
      run_id: runId,
      status,
      end_time: endTime || Date.now(),
    };
    return this.request('/api/2.0/mlflow/runs/update', 'POST', body);
  }

  /**
   * Search for runs
   * @param experimentIds An array of experiment IDs to search
   * @param filter A filter string to apply to the search
   * @param maxResults The maximum number of results to return (optional)
   * @returns The search results
   */
  async searchRuns(experimentIds: string[], filter?: string, maxResults?: number): Promise<any> {
    const body = {
      experiment_ids: experimentIds,
      filter: filter || '',
      max_results: maxResults || 1000,
    };
    return this.request('/api/2.0/mlflow/runs/search', 'POST', body);
  }
}