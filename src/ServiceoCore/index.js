"use strict";

const axios = require("axios");
const Logger = use("Logger");
const Redis = use("Redis");
const https = require('https');

class ServiceoCore {
  constructor(Config) {
    this.Config = Config;
    this._token = null;
    this._tokenExpiresAt = null;
    this._redisTTL = Config.get("serviceoCore.redisTTL");
    this._baseUrl = Config.get("serviceoCore.baseUrl");
    this._authUrl = Config.get("auth.auth0.url");
    this._authGrantType = Config.get("auth.auth0.grantType");
    this._authClientId = Config.get("auth.auth0.clientId");
    this._authClientSecret = Config.get("auth.auth0.clientSecret");
    this._authAudience = Config.get("auth.auth0.audience");
    this._initialize();
  }

  async _initialize() {
    if (!this._token) {
      await this._getAuthToken();
    }
  }

  async _getAuthToken() {
    Logger.debug("getting new auth token from auth0");
    await axios({
      method: "post",
      url: this._authUrl,
      data: {
        grant_type: this._authGrantType,
        client_id: this._authClientId,
        client_secret: this._authClientSecret,
        audience: this._authAudience
      }
    })
      .then(response => {
        this._token = response.data.access_token;
        this._tokenExpiresAt = Date.now() + response.data.expires_in;
      })
      .catch(error => {
        Logger.error(error);
      });
  }

  async _refreshAuthToken() {
    if (!this._token) {
      Logger.debug("No token found. Redirecting to get new auth token");
      await this._getAuthToken();
      return;
    }

    if (this._tokenExpiresAt < Date.now() - 300) {
      Logger.debug("Refreshing auth token from auth0");
      await this._getAuthToken();
      return;
    }
  }

  async getAccountBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Accounts",
      { sfdcId: sfdcId },
      `Account::${sfdcId}`,
      this._redisTTL["account"]
    );
  }

  async getAccountById(id) {
    return this._fetchAndCache(
      "Accounts",
      { id: id },
      `Account::${id}`,
      this._redisTTL["account"]
    );
  }

  async getProgramBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Projects",
      { sfdcId: sfdcId },
      `Project::${sfdcId}`,
      this._redisTTL["program"]
    );
  }

  async getProgramById(id) {
    return this._fetchAndCache(
      "Projects",
      { id: id },
      `Project::${id}`,
      this._redisTTL["program"]
    );
  }

  getDepartmentByCode(code) {
    return this._fetchAndCache(
      "DepartmentRoles",
      { Department_Acronym__c: code },
      `DepartmentRole::${code}`,
      this._redisTTL["department"] || 1800
    );
  }

  // TODO: Need to be fixed. May be use getDepartmentMember() instead.
  getContactsForDepartment(sfdcId) {
    return this._fetchAndCache(
      "Contact",
      { Department: sfdcId },
      `DepartmentContacts::${sfdcId}`,
      this._redisTTL["department"] || 1800
    );
  }

  getTeamByCode(code) {
    return this._fetchAndCache(
      "Groups",
      { Department_Group_Code__c: code },
      `Team::${code}`,
      this._redisTTL["team"] || 1800
    );
  }

  getTeamMembers(sfdcId) {
    return this._fetchAndCache(
      "DepartmentRoles",
      { PgMO_Groups__c: sfdcId },
      `TeamMembers::${sfdcId}`,
      this._redisTTL["team"] || 1800
    );
  }

  // TODO: Needs to be fixed. No direct relationship to worker in contact
  getContactByWorkerId(sfdcId) {
    return this._fetchAndCache(
      "Contacts",
      { sfdcId: sfdcId },
      `Contact::${sfdcId}`,
      this._redisTTL["contact"] || 1800
    );
  }

  async getContactBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Contacts",
      { sfdcId: sfdcId },
      `Contact::${sfdcId}`,
      this._redisTTL["contact"] || 1800
    );
  }

  async getContactByEmail(email) {
    const cacheKey = 'Contact::' + email.replace(/\@/g, '_')
    return this._fetchAndCache(
      "Contacts",
      { Email: email },
      cacheKey,
      this._redisTTL["contact"] || 1800
    );
  }

  getDepartmentMembers(departmentCode, accountId) { }

  getUserByEmail(email) {
    const cacheKey = 'User::' + email.replace(/\@/g, '_')
    return this._fetchAndCache(
      "Users",
      { username: email },
      cacheKey,
      this._redisTTL["user"]
    );
  }

  async getUserById(id) {
    return this._fetchAndCache(
      "Users",
      { id: id },
      `User::${id}`,
      this._redisTTL["user"]
    );
  }

  async getUserBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Users",
      { sfdcId: sfdcId },
      `User::${sfdcId}`,
      this._redisTTL["user"]
    );
  }

  async getJobBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Jobs",
      { sfdcId: sfdcId },
      `Job::${sfdcId}`,
      this._redisTTL["job"]
    );
  }

  async getJobById(id) {
    return this._fetchAndCache(
      "Jobs",
      { id: id },
      `Job::${id}`,
      this._redisTTL["job"]
    );
  }

  async getCaseBySfdcId(sfdcId) {
    return this._fetchAndCache(
      "Cases",
      { sfdcId: sfdcId },
      `Case::${sfdcId}`,
      this._redisTTL["case"]
    );
  }

  async getCaseById(id) {
    return this._fetchAndCache(
      "Cases",
      { id: id },
      `Case::${id}`,
      this._redisTTL["case"]
    );
  }

  async _fetchAndCache(subUrl, where, cacheKey, cacheTTL) {
    return new Promise(async (resolve, reject) => {
      const url = `${this._baseUrl}/${subUrl}`
      Logger.debug(`Request received for ${url} with following conditions`)
      Logger.debug(where)
      const cacheResult = await Redis.get(cacheKey);
      if (cacheResult) {
        Logger.debug('Request results found in cache. Serving from cache instead!')
        return resolve(JSON.parse(cacheResult));
      }

      await this._refreshAuthToken();
      try {
        Logger.debug(`Sending get request to ${url}`)
        const agent = new https.Agent({
          rejectUnauthorized: false
        });
        await axios.get(url, {
          httpsAgent: agent,
          data: { filter: { where: where } },
          headers: { Authorization: "Bearer " + this._token }
        }).then(res => {
          let result = null;
          if (Array.isArray(res.data) && res.data.length > 1) {
            result = res.data;
          } else {
            result = res.data[0];
          }
          if (result) {
            Logger.debug('Result found matching the condition in GET request')
            Redis.set(cacheKey, JSON.stringify(result), "EX", cacheTTL);
            resolve(result);
          } else {
            Logger.debug('No results found matching the condition in GET request')
            resolve(null)
          }
        }).catch(err => {
          Logger.error(`Error encountered while making GET request to ${url}`)
          reject(err)
        })
      } catch (err) {
        Logger.error(`Error encountered while making GET request to ${url}`)
        reject(err)
      }
    })
  }
}

module.exports = ServiceoCore;
