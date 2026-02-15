import SibApiV3Sdk from 'sib-api-v3-sdk';
import { env } from './env.js';

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = env.BREVO_API_KEY;

export const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const DEFAULT_SENDER = {
    name: 'Multi-Tenant App',
    email: 'no-reply@devs-tinder.site',
};
