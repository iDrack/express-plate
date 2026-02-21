import { Container } from 'typedi';

export class MockContainer {
  /**
   * Register a mock service in the container
   */
  static mockService<T>(serviceClass: any, mockImplementation: Partial<T>): void {
    Container.set(serviceClass, mockImplementation as T);
  }

  /**
   * Create a complete mock for a service class
   */
  static createMockService<T>(serviceClass: any): jest.Mocked<T> {
    const mockInstance = {} as jest.Mocked<T>;
    
    // Get all methods from the prototype
    const prototype = serviceClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');

    // Mock all methods
    methodNames.forEach(methodName => {
      mockInstance[methodName as keyof T] = jest.fn() as any;
    });

    Container.set(serviceClass, mockInstance);
    return mockInstance;
  }

  /**
   * Reset all mocks and container
   */
  static reset(): void {
    Container.reset();
    jest.clearAllMocks();
  }
}