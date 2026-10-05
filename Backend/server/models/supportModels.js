const mongoose = require("mongoose");

/**
 * SupportTicket Model
 * Platform helpdesk tickets submitted by Laundries, Customers, or Delivery Partners.
 */
const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    laundryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laundry",
      default: null,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["billing", "technical", "order_issue", "account", "general"],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    responses: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ticketId unique index is declared via `unique: true` on the field itself — no schema.index() needed.
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ user: 1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
