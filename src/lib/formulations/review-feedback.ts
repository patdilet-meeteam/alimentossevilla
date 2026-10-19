import {ZodError} from 'zod';
import {ReviewValidationError} from './review-validation-error';
export async function reviewFeedback<T>(operation:()=>Promise<T>):Promise<{ok:true;result:T}|{ok:false;error:string}>{
 try{return {ok:true,result:await operation()};}catch(error){return {ok:false,error:error instanceof ReviewValidationError?error.message:error instanceof ZodError?'Revise los campos obligatorios y los valores decimales.':'No se pudo completar la revisión. Recargue y vuelva a intentarlo.'};}
}
