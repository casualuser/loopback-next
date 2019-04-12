// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/authentication
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Getter, inject } from '@loopback/context';
import { Provider, ValueOrPromise } from '@loopback/core';
import { AuthenticationMetadata } from '../decorators/authenticate.decorator';
import { extensionPoint, extensions } from '../decorators/authentication-extension.decorators';
import { AuthenticationBindings } from '../keys';
import { AuthenticationStrategy } from '../types';

@extensionPoint('authentication-strategy')
export class AuthenticationStrategyProvider
  implements Provider<AuthenticationStrategy | undefined> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
    @extensions() // Sugar for @inject.getter(filterByTag({extensionPoint: 'greeter'}))
    private authenticationStrategies: Getter<AuthenticationStrategy[]>,
    // Keep the passport strategy as a common provider
    // or turn it into another extension point.
    @inject(AuthenticationBindings.PASSPORT_STRATEGY, { optional: true })
    private passportStrategy?: AuthenticationStrategy,
  ) { }
  value(): ValueOrPromise<AuthenticationStrategy | undefined> {
    if (!this.metadata) {
      return;
    }
    const name = this.metadata.strategy;

    const isPassportStrategy =
      this.metadata.options && this.metadata.options.isPassportStrategy;
    if (isPassportStrategy) {
      return this.passportStrategy;
    }

    return this.findAuthenticationStrategy(name).then(function (strategy) {
      if (strategy) {
        return strategy;
      } else {
        throw new Error(`The strategy '${name}' is not available.`);
      }
    });
  }

  async findAuthenticationStrategy(name: string) {
    const strategies = await this.authenticationStrategies();
    const matchingAuthStrategy = strategies.find(a => a.name === name);
    return matchingAuthStrategy;
  }
}
