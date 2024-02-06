import rateLimit from 'express-rate-limit';
import { FintechResponse } from './FintechResponse';

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 1, 
  message: FintechResponse.getMessages().RATERESPONSE
});

export default limiter;
