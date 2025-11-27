/**
 * CRM Service
 * Manages high-value member relationships, notes, tasks, and concierge workflows
 */

import { getCollection } from '../db/mongodb';
import { ObjectId } from 'mongodb';

export interface CRMNote {
  _id?: ObjectId;
  userId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMTask {
  _id?: ObjectId;
  assigneeId: string;
  assigneeName: string;
  type: 'initial_call' | 'match_suggestion' | 'check_in' | 'renewal_discussion' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description?: string;
  relatedUserId?: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberSearchFilters {
  query?: string;
  plan?: string;
  minLTV?: number;
  engagementScore?: 'low' | 'medium' | 'high';
  conciergeStatus?: 'active' | 'inactive';
  tribe?: string;
  city?: string;
  country?: string;
}

export class CRMService {
  /**
   * Search members with filters
   */
  static async searchMembers(filters: MemberSearchFilters, page: number = 1, limit: number = 20) {
    const collection = await getCollection('users');
    const profilesCollection = await getCollection('profiles');
    const subscriptionsCollection = await getCollection('subscriptions');
    
    const query: any = {};
    
    if (filters.query) {
      query.$or = [
        { email: { $regex: filters.query, $options: 'i' } },
        { 'profile.name': { $regex: filters.query, $options: 'i' } }
      ];
    }
    
    if (filters.plan) {
      query['subscription.plan'] = filters.plan;
    }
    
    if (filters.tribe) {
      query['profile.tribe'] = filters.tribe;
    }
    
    const skip = (page - 1) * limit;
    
    const members = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await collection.countDocuments(query);
    
    return {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get full member profile with activity history
   */
  static async getMemberProfile(userId: string) {
    const usersCollection = await getCollection('users');
    const profilesCollection = await getCollection('profiles');
    const subscriptionsCollection = await getCollection('subscriptions');
    const notesCollection = await getCollection('crm_notes');
    const tasksCollection = await getCollection('crm_tasks');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new Error('User not found');
    }
    
    const profile = await profilesCollection.findOne({ userId });
    const subscription = await subscriptionsCollection.findOne({ userId });
    const notes = await notesCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    const tasks = await tasksCollection
      .find({ relatedUserId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    return {
      user,
      profile,
      subscription,
      notes,
      tasks
    };
  }

  /**
   * Create a note for a member
   */
  static async createNote(data: {
    userId: string;
    authorId: string;
    authorName: string;
    content: string;
    attachments?: string[];
  }): Promise<CRMNote> {
    const collection = await getCollection<CRMNote>('crm_notes');
    
    const note: CRMNote = {
      userId: data.userId,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      attachments: data.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(note);
    note._id = result.insertedId;
    
    return note;
  }

  /**
   * Create a task
   */
  static async createTask(data: {
    assigneeId: string;
    assigneeName: string;
    type: CRMTask['type'];
    priority: CRMTask['priority'];
    title: string;
    description?: string;
    relatedUserId?: string;
    dueDate?: Date;
  }): Promise<CRMTask> {
    const collection = await getCollection<CRMTask>('crm_tasks');
    
    const task: CRMTask = {
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      type: data.type,
      status: 'pending',
      priority: data.priority,
      title: data.title,
      description: data.description,
      relatedUserId: data.relatedUserId,
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(task);
    task._id = result.insertedId;
    
    return task;
  }

  /**
   * Update task status
   */
  static async updateTask(taskId: string, update: {
    status?: CRMTask['status'];
    priority?: CRMTask['priority'];
    description?: string;
    dueDate?: Date;
  }) {
    const collection = await getCollection<CRMTask>('crm_tasks');
    
    const updateDoc: any = {
      updatedAt: new Date()
    };
    
    if (update.status) {
      updateDoc.status = update.status;
      if (update.status === 'completed') {
        updateDoc.completedAt = new Date();
      }
    }
    
    if (update.priority) updateDoc.priority = update.priority;
    if (update.description) updateDoc.description = update.description;
    if (update.dueDate) updateDoc.dueDate = update.dueDate;
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(taskId) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Get tasks for assignee
   */
  static async getTasks(assigneeId: string, status?: CRMTask['status']) {
    const collection = await getCollection<CRMTask>('crm_tasks');
    
    const query: any = { assigneeId };
    if (status) {
      query.status = status;
    }
    
    const tasks = await collection
      .find(query)
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .toArray();
    
    return tasks;
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks() {
    const collection = await getCollection<CRMTask>('crm_tasks');
    
    const tasks = await collection
      .find({
        status: { $in: ['pending', 'in_progress'] },
        dueDate: { $lt: new Date() }
      })
      .sort({ dueDate: 1 })
      .toArray();
    
    return tasks;
  }
}
