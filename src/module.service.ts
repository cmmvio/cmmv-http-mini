import { Singleton, Service, Logger, Application } from '@cmmv/core';

@Service('queue')
export class ModuleService extends Singleton {
  public logger: Logger = new Logger('ModuleService');

  public static async loadConfig(application: Application): Promise<void> {}
}
