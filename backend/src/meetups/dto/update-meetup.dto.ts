import { PartialType } from '@nestjs/mapped-types';
import { CreateMeetupDto } from './create-meetup.dto';

/// 문서에 PUT /meetups/{id}의 세부 파라미터가 명시돼 있지 않아, 생성 DTO의
/// 모든 필드를 선택값으로 만든 부분 수정(partial update)으로 설계했다.
export class UpdateMeetupDto extends PartialType(CreateMeetupDto) {}
