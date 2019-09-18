import rp from "request-promise";

export class TestClient {
  constructor(url) {
    this.url = url;
    this.options = {
      jar: rp.jar(),
      json: true,
      withCredentials: true
    };
  }

  async login(email, password) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
            mutation login {
                login(email: "${email}", password: "${password}") {
                    id
                    email
                }
            }
        `
      }
    });
  }

  async logout(fromAll) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
            mutation logout {
                logout(fromAll: ${fromAll})
            }
        `
      }
    });
  }

  async me() {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
            query me {
                me {
                    id
                    email
                }
            }
        `
      }
    });
  }

  async register(email, password) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
            mutation register {
                register(email: "${email}", password: "${password}") {
                    id
                    email
                }
            }
        `
      }
    });
  }

  async resetPassword(token, newPassword) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
            mutation resetPassword {
              resetPassword(token: "${token}", newPassword: "${newPassword}")
            }
        `
      }
    });
  }

  async httpGet(url) {
    return rp.get(url, { json: true });
  }
}
