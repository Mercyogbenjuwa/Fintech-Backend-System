/**===================================== Generate Verification Code ===================================== **/
export type GenerateVerificationCodeFn = () => string;
export const generateVerificationCode: GenerateVerificationCodeFn = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


/**===================================== Validate Password ===================================== **/
export type ValidatePasswordFn = (password: string) => boolean;
export const validatePassword: ValidatePasswordFn = (password: string) =>{
    if (password.length < 8) {
        return false;
      }
    
      if (password.length > 15) {
        return false;
      }
    
      if (!/\d/.test(password)) {
        return false;
      }
    
      if (!/[a-zA-Z]/.test(password)) {
        return false;
      }   
     
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
      }
    return true;
}
   
  



