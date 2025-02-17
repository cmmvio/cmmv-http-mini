import { HttpMini, ApplicationOptions, ServerOptions } from './application';

export default (
  applicationOptions?: ApplicationOptions,
  serverOptions?: ServerOptions,
) => {
  return new HttpMini(applicationOptions, serverOptions);
};
