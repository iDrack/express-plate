export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  uptime?:  number;
}

export interface DependencyCheck {
  status: HealthStatus;
  responseTime: number;
  message?:  string;
}

export interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: {
    database:  boolean;
    [key: string]: boolean;
  };
}

export interface DetailedHealthCheckResponse extends HealthCheckResponse {
  checks: {
    database?:  DependencyCheck;
    redis?: DependencyCheck;
    memory?: DependencyCheck;
    [key: string]: DependencyCheck | undefined;
  };
  version?:  string;
  environment?: string;
}