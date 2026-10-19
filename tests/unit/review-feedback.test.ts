import {it,expect} from 'vitest';
import {z} from 'zod';
import {reviewFeedback} from '@/lib/formulations/review-feedback';
import {ReviewValidationError} from '@/lib/formulations/review-validation-error';
it('returns expected review feedback as data, without framework-redacted exceptions',async()=>{expect(await reviewFeedback(async()=>{throw new ReviewValidationError('Faltan identidades o pesos de miembros');})).toEqual({ok:false,error:'Faltan identidades o pesos de miembros'});expect(await reviewFeedback(async()=>({id:'fixture'}))).toEqual({ok:true,result:{id:'fixture'}});});
it('does not reveal database or infrastructure details',async()=>{const result=await reviewFeedback(async()=>{throw Error('PRIVATE DATABASE CONNECTION DETAIL');});expect(result.ok).toBe(false);expect(JSON.stringify(result)).not.toContain('PRIVATE');});
it('returns a concise schema error without reflecting the supplied input',async()=>{const result=await reviewFeedback(async()=>z.object({quantity:z.number()}).parse({quantity:'private supplied text'}));expect(result).toEqual({ok:false,error:'Revise los campos obligatorios y los valores decimales.'});});
