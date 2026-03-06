import { AnnouncementsModule } from './announcements/announcements.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ClassesModule } from './classes/classes.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExamsModule } from './exams/exams.module';
import { FilesModule } from './files/files.module';
import { GradesModule } from './grades/grades.module';
import { LessonsModule } from './lessons/lessons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ReportsModule } from './reports/reports.module';
import { RolesModule } from './roles/roles.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SchoolsModule } from './schools/schools.module';
import { UsersModule } from './users/users.module';

export const FEATURE_MODULES = [
  AuthModule,
  UsersModule,
  RolesModule,
  SchoolsModule,
  CoursesModule,
  ClassesModule,
  EnrollmentsModule,
  LessonsModule,
  AssignmentsModule,
  QuizzesModule,
  ExamsModule,
  GradesModule,
  AttendanceModule,
  ScheduleModule,
  AnnouncementsModule,
  NotificationsModule,
  FilesModule,
  ChatModule,
  ReportsModule,
  PaymentsModule,
];
