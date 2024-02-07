import rateLimit from 'express-rate-limit';
import { FintechResponse } from './FintechResponse';

//================================ Rate Limation =============================//
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 Minutes wait time
  max: 5, // maximum of 3 requests
  message: FintechResponse.getMessages().RATERESPONSE
});

export default limiter;
