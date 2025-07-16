const config = {
  development: {
    DOMAIN: 'localhost:3000',
    API_URL: 'http://localhost:8000',
    PROTOCOL: 'http'
  },
  production: {
    DOMAIN: 'menteee.com',
    API_URL: 'https://api.menteee.com',
    PROTOCOL: 'https'
  }
};

const environment = process.env.NODE_ENV || 'development';

export const ENV_CONFIG = config[environment];
export const SITE_URL = `${ENV_CONFIG.PROTOCOL}://${ENV_CONFIG.DOMAIN}`;

// Email addresses
export const CONTACT_EMAILS = {
  SUPPORT: 'support@menteee.com',
  DEMO: 'demo@menteee.com',
  ENTERPRISE: 'enterprise@menteee.com',
  GENERAL: 'hello@menteee.com'
};

// Social links (update these when you create accounts)
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/menteee_ai',
  LINKEDIN: 'https://linkedin.com/company/menteee',
  GITHUB: 'https://github.com/menteee'
};

// Google Form and other external links
export const EXTERNAL_LINKS = {
  WAITLIST_FORM: 'https://forms.gle/NGJ3gu5MstTyLSib8',
  CALENDLY_DEMO: 'https://calendly.com/menteee-demo'
};