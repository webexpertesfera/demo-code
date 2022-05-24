/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@nestjs/common';
import { ManagementClient, AuthenticationClient } from 'auth0';
import axios from 'axios';
import qs = require('qs');
import { RolesEnum } from 'src/core/entity/role.entity';
import { ErrorUtils } from '../error-handler';
import { Auth0Request } from './models/auth0-request';
import { CreateUser } from './models/create-user.model';

export class Auth0Client {
  private management;
  private auth0;
  private DEFAULT_CONNECTION = 'Username-Password-Authentication';

  constructor() {
    this.management = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      scope: 'read:users update:users',
    });
    this.auth0 = new AuthenticationClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
    });
    // this.axiosClient = axios.create({baseURL: process.env.AUTH0_DOMAIN, headers:  { 'content-type': 'application/json'}});
  }

  public async createUser(createUser: CreateUser & { password: string }) {
    try {
      const auth0Request = new Auth0Request(createUser);
      auth0Request.connection = this.DEFAULT_CONNECTION;
      return await this.management.createUser(auth0Request);
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  async changePassword(email) {
    try {
      // eslint-disable-next-line @typescript-eslint/camelcase
      await this.auth0.database.requestChangePasswordEmail({
        email,
        connection: this.DEFAULT_CONNECTION,
        // eslint-disable-next-line @typescript-eslint/camelcase
        client_id: process.env.AUTH0_CLIENT_ID,
      });
      // await this.management.updateUser({id}, { password, connection: this.DEFAULT_CONNECTION});
      // await this.management.changePassword({ email, connection: this.DEFAULT_CONNECTION });
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  /**
   * Updates the users email at the auth0 by user id
   * @param userId
   * @param newEmail
   */
  async changeEmail(userId: string, newEmail: string) {
    try {
      await this.management.updateUser(
        { id: userId },
        {
          email: newEmail,
          verify_email: true,
          email_verified: false,
          connection: this.DEFAULT_CONNECTION,
        },
      );
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  async deleteUser(userId) {
    try {
      await this.management.deleteUser({ id: userId });
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  async getUser(userId: string) {
    try {
      return await this.management.getUser({ id: userId });
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  public async assignUserRole(
    userId: string,
    roles: string[] = [RolesEnum.EMPLOYEE],
  ) {
    try {
      await this.management.assignRolestoUser({ id: userId }, { roles: roles });
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  public async removeUserRole(
    userId: string,
    roles: string[] = [RolesEnum.EMPLOYEE],
  ) {
    try {
      await this.management.removeRolesFromUser(
        { id: userId },
        { roles: roles },
      );

    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }

  async getAccessToken(code: string) {
    try {
      const response = await axios.post(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        qs.stringify({
          client_id: process.env.AUTH0_FRONT_CLIENT_ID,
          client_secret: process.env.AUTH0_FRONT_CLIENT_SECRET,
          audience: process.env.AUTH0_AUDIENCE,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.AUTH0_REDIRECT_URI,
        }),
      );

      return response.data;
    } catch (error) {
      ErrorUtils.handleError(error);
    }
  }
}
