import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";

// /**
//  * @name orders
//  * @method
//  * @memberof Order/NoMeteorQueries
//  * @summary Query the Orders collection for orders and (optionally) shopIds
//  * @param {Object} context - an object containing the per-request state
//  * @param {Object} params - request parameters
//  * @param {String} params.accountId - Account ID to search orders for
//  * @param {Object}  params.filters - Filters to apply to a list of orders
//  * @param {Array.<String>} params.shopIds - Shop IDs for the shops that owns the orders
//  * @returns {Promise<Object>|undefined} - An Array of Order documents, if found
//  */
// export default async function orders(context, { filters, shopIds } = {}) {
//   const { collections } = context;
//   const { Orders } = collections;

//   const query = {};
//   let createdAtFilter = {};
//   let fulfillmentStatusFilter = {};
//   let paymentStatusFilter = {};
//   let searchFieldFilter = {};
//   let statusFilter = {};

//   // Add a date range filter if provided, the filter will be
//   // applied to the createdAt database field.
//   if (filters && filters.createdAt) {
//     const { createdAt } = filters;
//     // Both fields are optional
//     const gteProp = createdAt.gte ? { $gte: createdAt.gte } : {};
//     const lteProp = createdAt.lte ? { $lte: createdAt.lte } : {};
//     createdAtFilter = {
//       createdAt: {
//         ...gteProp,
//         ...lteProp
//       }
//     };
//   }

//   // Validate user has permission to view orders for all shopIds
//   if (!shopIds) throw new ReactionError("invalid-param", "You must provide ShopId(s)");
//   for (const shopId of shopIds) {
//     await context.validatePermissions("reaction:legacy:orders", "read", { shopId }); // eslint-disable-line no-await-in-loop
//   }

//   query.shopId = { $in: shopIds };

//   // Add fulfillment status if provided
//   if (filters && filters.fulfillmentStatus) {
//     const fulfillmentStatuses = filters.fulfillmentStatus.map((status) => {
//       const prefix = status === "new" ? "" : "coreOrderWorkflow/";
//       return `${prefix}${status}`;
//     });

//     fulfillmentStatusFilter = {
//       "shipping.workflow.status": { $in: fulfillmentStatuses }
//     };
//   }

//   // Add payment status filters if provided
//   if (filters && filters.paymentStatus) {
//     paymentStatusFilter = {
//       "payments.status": { $in: filters.paymentStatus }
//     };
//   }

//   // Add order status filter if provided
//   if (filters && filters.status) {
//     const prefix = filters.status === "new" ? "" : "coreOrderWorkflow/";
//     statusFilter = {
//       "workflow.status": { $eq: `${prefix}${filters.status}` }
//     };
//   }

//   // Use `filters` to filters out results on the server
//   if (filters && filters.searchField) {
//     const { searchField } = filters;
//     const regexMatch = { $regex: _.escapeRegExp(searchField), $options: "i" };
//     searchFieldFilter = {
//       $or: [
//         // Exact matches
//         { _id: searchField }, // exact match the order id
//         { referenceId: searchField }, // exact match the reference id
//         { email: searchField }, // exact match the email
//         { "discounts.code": searchField },
//         { "shipping.address.phone": searchField },


//         // Regex match names as they include the whole name in one field
//         { "payments.address.fullName": regexMatch },
//         { "shipping.address.fullName": regexMatch },

//         // Regex match for payer phone number
//         { "payments.address.phone": regexMatch },
//       ]
//     };
//   }

//   // Build the final query
//   query.$and = [{
//     ...createdAtFilter,
//     ...fulfillmentStatusFilter,
//     ...paymentStatusFilter,
//     ...searchFieldFilter,
//     ...statusFilter
//   }];

//   return Orders.find(query);
// }

export default async function orders(context, { filters, shopIds } = {}) {
  const { collections } = context;
  const { Orders } = collections;

  const query = {};
  let createdAtFilter = {};
  let fulfillmentStatusFilter = {};
  let paymentStatusFilter = {};
  let searchFieldFilter = {};
  let statusFilter = {};

  // Initialize the $and array to ensure it exists before pushing filters into it
  query.$and = [];

  // Add a date range filter if provided, the filter will be
  // applied to the createdAt database field.
  if (filters && filters.createdAt) {
    const { createdAt } = filters;
    const gteProp = createdAt.gte ? { $gte: createdAt.gte } : {};
    const lteProp = createdAt.lte ? { $lte: createdAt.lte } : {};
    createdAtFilter = {
      createdAt: {
        ...gteProp,
        ...lteProp
      }
    };
    query.$and.push(createdAtFilter);
  }

  // Validate user has permission to view orders for all shopIds
  if (!shopIds) throw new ReactionError("invalid-param", "You must provide ShopId(s)");
  for (const shopId of shopIds) {
    await context.validatePermissions("reaction:legacy:orders", "read", { shopId }); // eslint-disable-line no-await-in-loop
  }

  query.shopId = { $in: shopIds };

  // Add fulfillment status if provided
  if (filters && filters.fulfillmentStatus) {
    const fulfillmentStatuses = filters.fulfillmentStatus.map((status) => {
      const prefix = status === "new" ? "" : "coreOrderWorkflow/";
      return `${prefix}${status}`;
    });

    fulfillmentStatusFilter = {
      "shipping.workflow.status": { $in: fulfillmentStatuses }
    };
    query.$and.push(fulfillmentStatusFilter);
  }

  // Add payment status filters if provided
  if (filters && filters.paymentStatus) {
    paymentStatusFilter = {
      "payments.status": { $in: filters.paymentStatus }
    };
    query.$and.push(paymentStatusFilter);
  }

  // Add order status filter if provided
  if (filters && filters.status) {
    const prefix = filters.status === "new" ? "" : "coreOrderWorkflow/";

    console.log("Order Status Filter added", prefix, filters)
    statusFilter = {
      "workflow.status": { $eq: `${prefix}${filters.status}` }
    };

    console.log("Status Filter added", statusFilter)
    query.$and.push(statusFilter);
  }

  // Add sellerId filter if provided
  if (filters && filters.sellerId) {
    const sellerIdFilter = {
      "shipping.items.sellerId": filters.sellerId
    };
    query.$and.push(sellerIdFilter);
  }

  // Use filters to filter out results on the server
  if (filters && filters.searchField) {
    const { searchField } = filters;
    const regexMatch = { $regex: _.escapeRegExp(searchField), $options: "i" };
    searchFieldFilter = {
      // $or: [
      //   { _id: searchField },
      //   { referenceId: searchField },
      //   { email: searchField },
      //   { "discounts.code": searchField },
      //   { "shipping.address.phone": searchField },
      //   { "payments.address.fullName": regexMatch },
      //   { "shipping.address.fullName": regexMatch },
      //   { "payments.address.phone": regexMatch },
      // ]
      $or: [
        { _id: searchField },
        { referenceId: searchField },
        { email: searchField },
        { "discounts.code": searchField },
        { "shipping.address.phone": searchField },


        // Regex match names as they include the whole name in one field
        { "payments.address.fullName": regexMatch },
        { "shipping.address.fullName": regexMatch },
        { "payments.address.phone": regexMatch },
      ]
    };
    query.$and.push(searchFieldFilter);
  }

  // Ensure query.$and is not empty before returning it
  if (!query.$and.length) delete query.$and;

  return Orders.find(query);
}
