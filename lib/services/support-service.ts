/**
 * Support Service
 * Manages support tickets, SLA tracking, and member assistance
 */

import { getCollection } from '../db/mongodb';
import { ObjectId } from 'mongodb';

export interface SupportTicket {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'safety' | 'general' | 'account';
  subject: string;
  description: string;
  attachments?: string[];
  assignedTo?: string;
  assignedToName?: string;
  slaDeadline: Date;
  slaBreach: boolean;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  firstResponseAt?: Date;
}

export interface SupportMessage {
  _id?: ObjectId;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'customer' | 'agent';
  message: string;
  attachments?: string[];
  isInternal?: boolean;
  createdAt: Date;
}

export interface CannedResponse {
  _id?: ObjectId;
  title: string;
  content: string;
  category: SupportTicket['category'];
  createdBy: string;
  createdAt: Date;
  useCount: number;
}

export class SupportService {
  /**
   * Calculate SLA deadline based on priority
   */
  private static calculateSLADeadline(priority: SupportTicket['priority']): Date {
    const now = new Date();
    let hours: number;
    
    switch (priority) {
      case 'urgent':
        hours = 2;
        break;
      case 'high':
        hours = 4;
        break;
      case 'medium':
        hours = 24;
        break;
      case 'low':
      default:
        hours = 72;
        break;
    }
    
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Create a support ticket
   */
  static async createTicket(data: {
    userId: string;
    userEmail: string;
    userName: string;
    priority?: SupportTicket['priority'];
    category: SupportTicket['category'];
    subject: string;
    description: string;
    attachments?: string[];
  }): Promise<SupportTicket> {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    const priority = data.priority || 'medium';
    const slaDeadline = this.calculateSLADeadline(priority);
    
    const ticket: SupportTicket = {
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      status: 'open',
      priority,
      category: data.category,
      subject: data.subject,
      description: data.description,
      attachments: data.attachments || [],
      slaDeadline,
      slaBreach: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(ticket);
    ticket._id = result.insertedId;
    
    // Create initial message
    await this.addMessage({
      ticketId: ticket._id.toString(),
      authorId: data.userId,
      authorName: data.userName,
      authorType: 'customer',
      message: data.description,
      attachments: data.attachments
    });
    
    return ticket;
  }

  /**
   * Get ticket by ID
   */
  static async getTicket(ticketId: string) {
    const ticketsCollection = await getCollection<SupportTicket>('support_tickets');
    const messagesCollection = await getCollection<SupportMessage>('support_messages');
    
    const ticket = await ticketsCollection.findOne({ _id: new ObjectId(ticketId) });
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const messages = await messagesCollection
      .find({ ticketId })
      .sort({ createdAt: 1 })
      .toArray();
    
    return { ticket, messages };
  }

  /**
   * Get user's tickets
   */
  static async getUserTickets(userId: string, status?: SupportTicket['status']) {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    const query: any = { userId };
    if (status) {
      query.status = status;
    }
    
    const tickets = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return tickets;
  }

  /**
   * Update ticket
   */
  static async updateTicket(ticketId: string, update: {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
    category?: SupportTicket['category'];
    assignedTo?: string;
    assignedToName?: string;
  }) {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    const updateDoc: any = {
      updatedAt: new Date()
    };
    
    if (update.status) {
      updateDoc.status = update.status;
      if (update.status === 'resolved') {
        updateDoc.resolvedAt = new Date();
      } else if (update.status === 'closed') {
        updateDoc.closedAt = new Date();
      }
    }
    
    if (update.priority) {
      updateDoc.priority = update.priority;
      updateDoc.slaDeadline = this.calculateSLADeadline(update.priority);
    }
    
    if (update.category) updateDoc.category = update.category;
    if (update.assignedTo) {
      updateDoc.assignedTo = update.assignedTo;
      updateDoc.assignedToName = update.assignedToName;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(ticketId) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Assign ticket to agent
   */
  static async assignTicket(ticketId: string, agentId: string, agentName: string) {
    return this.updateTicket(ticketId, {
      status: 'in_progress',
      assignedTo: agentId,
      assignedToName: agentName
    });
  }

  /**
   * Resolve ticket
   */
  static async resolveTicket(ticketId: string) {
    return this.updateTicket(ticketId, { status: 'resolved' });
  }

  /**
   * Add message to ticket
   */
  static async addMessage(data: {
    ticketId: string;
    authorId: string;
    authorName: string;
    authorType: 'customer' | 'agent';
    message: string;
    attachments?: string[];
    isInternal?: boolean;
  }): Promise<SupportMessage> {
    const collection = await getCollection<SupportMessage>('support_messages');
    const ticketsCollection = await getCollection<SupportTicket>('support_tickets');
    
    const message: SupportMessage = {
      ticketId: data.ticketId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorType: data.authorType,
      message: data.message,
      attachments: data.attachments || [],
      isInternal: data.isInternal || false,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(message);
    message._id = result.insertedId;
    
    // Update ticket's updatedAt and firstResponseAt if this is first agent response
    const updateDoc: any = { updatedAt: new Date() };
    
    if (data.authorType === 'agent') {
      const ticket = await ticketsCollection.findOne({ _id: new ObjectId(data.ticketId) });
      if (ticket && !ticket.firstResponseAt) {
        updateDoc.firstResponseAt = new Date();
      }
    }
    
    await ticketsCollection.updateOne(
      { _id: new ObjectId(data.ticketId) },
      { $set: updateDoc }
    );
    
    return message;
  }

  /**
   * Get support queue with filters
   */
  static async getQueue(filters: {
    status?: SupportTicket['status'] | SupportTicket['status'][];
    priority?: SupportTicket['priority'];
    category?: SupportTicket['category'];
    assignedTo?: string;
    breachedOnly?: boolean;
  }, page: number = 1, limit: number = 50) {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    const query: any = {};
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status };
      } else {
        query.status = filters.status;
      }
    }
    
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;
    if (filters.breachedOnly) query.slaBreach = true;
    
    const skip = (page - 1) * limit;
    
    // Check for SLA breaches
    await this.updateSLABreaches();
    
    const tickets = await collection
      .find(query)
      .sort({ priority: -1, slaDeadline: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await collection.countDocuments(query);
    
    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update SLA breach status for all tickets
   */
  private static async updateSLABreaches() {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    await collection.updateMany(
      {
        status: { $in: ['open', 'in_progress', 'waiting_on_customer'] },
        slaDeadline: { $lt: new Date() },
        slaBreach: false
      },
      {
        $set: { slaBreach: true }
      }
    );
  }

  /**
   * Get canned responses
   */
  static async getCannedResponses(category?: SupportTicket['category']) {
    const collection = await getCollection<CannedResponse>('canned_responses');
    
    const query: any = {};
    if (category) query.category = category;
    
    const responses = await collection
      .find(query)
      .sort({ useCount: -1, title: 1 })
      .toArray();
    
    return responses;
  }

  /**
   * Create canned response
   */
  static async createCannedResponse(data: {
    title: string;
    content: string;
    category: SupportTicket['category'];
    createdBy: string;
  }): Promise<CannedResponse> {
    const collection = await getCollection<CannedResponse>('canned_responses');
    
    const response: CannedResponse = {
      title: data.title,
      content: data.content,
      category: data.category,
      createdBy: data.createdBy,
      createdAt: new Date(),
      useCount: 0
    };
    
    const result = await collection.insertOne(response);
    response._id = result.insertedId;
    
    return response;
  }

  /**
   * Increment canned response use count
   */
  static async useCannedResponse(responseId: string) {
    const collection = await getCollection<CannedResponse>('canned_responses');
    
    await collection.updateOne(
      { _id: new ObjectId(responseId) },
      { $inc: { useCount: 1 } }
    );
  }

  /**
   * Get SLA compliance metrics
   */
  static async getSLAMetrics(startDate: Date, endDate: Date) {
    const collection = await getCollection<SupportTicket>('support_tickets');
    
    const tickets = await collection
      .find({
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray();
    
    const total = tickets.length;
    const breached = tickets.filter(t => t.slaBreach).length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    
    const avgResponseTime = tickets
      .filter(t => t.firstResponseAt)
      .reduce((sum, t) => {
        const responseTime = t.firstResponseAt!.getTime() - t.createdAt.getTime();
        return sum + responseTime;
      }, 0) / tickets.filter(t => t.firstResponseAt).length || 0;
    
    const avgResolutionTime = tickets
      .filter(t => t.resolvedAt)
      .reduce((sum, t) => {
        const resolutionTime = t.resolvedAt!.getTime() - t.createdAt.getTime();
        return sum + resolutionTime;
      }, 0) / tickets.filter(t => t.resolvedAt).length || 0;
    
    return {
      total,
      breached,
      breachRate: total > 0 ? (breached / total) * 100 : 0,
      resolved,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
      avgResponseTime: avgResponseTime / (1000 * 60), // minutes
      avgResolutionTime: avgResolutionTime / (1000 * 60 * 60) // hours
    };
  }
}
