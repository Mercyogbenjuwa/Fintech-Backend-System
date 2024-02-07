import { Request, Response, NextFunction } from 'express';
import { FintechResponse } from './FintechResponse';


//================================ Validating Content Type  =============================//
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const contentType = req.get('Content-Type');
      if (!contentType || !allowedTypes.includes(contentType)) {
        return res.status(FintechResponse.HTTP_BAD_REQUEST).json({
          responseMessage: FintechResponse.getMessages().INVALIDCONTENTTYPE,
          responseCode: FintechResponse.HTTP_BAD_REQUEST,
          responseData: null,
        });
      }
      next();
    } catch (error) {
      console.error('Error validating content type:', error);
      return res.status(FintechResponse.HTTP_INTERNAL_SERVER_ERROR).json({
        responseMessage: FintechResponse.getMessages().ERROR,
        responseCode: FintechResponse.HTTP_INTERNAL_SERVER_ERROR,
        responseData: null,
      });
    }
  };
};
