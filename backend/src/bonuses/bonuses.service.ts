import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class BonusesService {
  constructor(@Inject(DRIZZLE) private db:any){}
  async list(companyId:string,dto:PaginationDto){const where=eq(schema.bonuses.companyId,companyId);const total=await this.db.select({count: sql`count(*)`}).from(schema.bonuses).where(where).then((r:any)=>Number(r[0].count));const rows=await this.db.query.bonuses.findMany({where,limit:dto.limit,offset:dto.offset,orderBy:(b:any,{desc}:any)=>desc(b.bonusDate)});return paginated(rows,total,dto,'Bonuses fetched');}
  async create(companyId:string,dto:any,userId:string){const [row]=await this.db.insert(schema.bonuses).values({...dto,companyId}).returning();return {success:true,data:row,message:'Bonus created'};}
  async get(companyId:string,id:string){const row=await this.db.query.bonuses.findFirst({where:(b:any,{eq,and}:any)=>and(eq(b.id,id),eq(b.companyId,companyId))});if(!row)throw new NotFoundException('Bonus not found');return {success:true,data:row};}
  async update(companyId:string,id:string,dto:any){const [row]=await this.db.update(schema.bonuses).set({...dto,updatedAt:new Date()}).where(and(eq(schema.bonuses.id,id),eq(schema.bonuses.companyId,companyId))).returning();return {success:true,data:row,message:'Bonus updated'};}
  async remove(companyId:string,id:string){await this.db.delete(schema.bonuses).where(and(eq(schema.bonuses.id,id),eq(schema.bonuses.companyId,companyId)));return {success:true,data:null,message:'Bonus deleted'};}
}

