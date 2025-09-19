import { type User, type InsertUser, type Job, type InsertJob, type Application, type InsertApplication, type AdminUser, type InsertAdminUser } from "@shared/schema";
import { GoogleSheetsStorage } from "./googleSheetsStorage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  
  // Jobs
  getAllJobs(): Promise<Job[]>;
  getActiveJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string): Promise<boolean>;
  searchJobs(keyword: string): Promise<Job[]>;
  
  // Applications
  getApplicationsForJob(jobId: string): Promise<Application[]>;
  getAllApplications(): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: string, status: string, notes?: string): Promise<Application | undefined>;
}

export const storage = new GoogleSheetsStorage();
