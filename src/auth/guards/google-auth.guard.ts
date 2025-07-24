import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): any {
    try {
      const request = context.switchToHttp().getRequest();

      const state = request.query.state;

      return {
        state: state,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
