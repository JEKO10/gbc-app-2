import PrinterImin, {
  IminPrintAlign,
  IminQrcodeCorrectionLevel,
} from "react-native-printer-imin";
import { Order } from "./types";

/**
 * Prints a compact 58mm receipt using react-native-printer-imin
 * Layout goals: tight spacing, small readable font, aligned columns, minimal blanks.
 */
export async function printOrder(order: Order) {
  // Helpers
  const dash = "--------------------------------"; // ~32 chars fits 58mm
  const money = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(n);

  const base64Img = `data:image/png;base64,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`;

  // Column layout for 58mm (384 px): Qty | Name | Price
  // Choose widths that sum <= 384. These work well in practice:
  const COL_QTY = 48; // ~ 6mm
  const COL_NAME = 240; // ~ 30mm
  const COL_PRICE = 96; // ~ 12mm
  const total = (order.amount / 100).toFixed(2);
  const address =
    order.user.address || order.user.googleAddress || "No address provided";
  const createdAt = new Date(order.createdAt).toLocaleString("en-GB");
  const estimatedTime = new Date(
    new Date(order.createdAt).getTime() + 45 * 60000
  ).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalItems =
    order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  try {
    await PrinterImin.initPrinter();

    // 58mm page, small font, tight line spacing
    if ((PrinterImin as any).setPageFormat) {
      // 1 = 58mm on most iMin SDKs
      await (PrinterImin as any).setPageFormat(1);
    }
    await PrinterImin.setAlignment(IminPrintAlign.left);
    await PrinterImin.setTextSize(24); // small & readable
    if ((PrinterImin as any).setTextLineSpacing) {
      await (PrinterImin as any).setTextLineSpacing(0.9); // tighter lines
    }

    await PrinterImin.printSingleBitmap(base64Img);

    // Top: Brand / Store (optional – keep minimal)
    await PrinterImin.setTextStyle(1); // bold if you want a store name
    await PrinterImin.printText(
      `${order.restaurant.name}` || "General Bilimoria's Canteen\n"
    );
    await PrinterImin.setTextStyle(0);

    // Order number (bold & centered block line like Deliveroo)
    await PrinterImin.setTextStyle(1);
    await PrinterImin.setAlignment(IminPrintAlign.center);
    await PrinterImin.printText(`#${order.orderNumber.replace(/^.*-/, "")}\n`);
    await PrinterImin.setTextStyle(0);
    await PrinterImin.setAlignment(IminPrintAlign.left);

    // Order notes (one line, no extra blanks)
    if (order.orderNote && order.orderNote.trim().length) {
      await PrinterImin.printText(`Order notes: ${order.orderNote.trim()}\n`);
    }

    // Items (use columns: Qty | Name | Price)
    for (const it of order.items) {
      await PrinterImin.printColumnsText([
        {
          text: `${it.quantity}x`,
          width: COL_QTY,
          fontSize: 24,
          align: IminPrintAlign.left,
        },
        {
          text: it.title,
          width: COL_NAME,
          fontSize: 24,
          align: IminPrintAlign.left,
        },
        // MONEY MOZDA DA MAKNES
        {
          text: money(it.price),
          width: COL_PRICE,
          fontSize: 24,
          align: IminPrintAlign.right,
        },
      ]);
    }

    if (totalItems) {
      await PrinterImin.printText(`\nNo. of items: ${totalItems}`);
    }

    await PrinterImin.setTextStyle(1);
    await PrinterImin.printColumnsText([
      { text: "", width: COL_QTY, fontSize: 24, align: IminPrintAlign.left },
      {
        text: "Total:",
        width: COL_NAME,
        fontSize: 24,
        align: IminPrintAlign.right,
      },
      {
        text: money(parseFloat(total)),
        width: COL_PRICE,
        fontSize: 24,
        align: IminPrintAlign.right,
      },
    ]);
    await PrinterImin.setTextStyle(0);

    // Customer block (compact)
    if (order.user.name || order.user.phone || address) {
      await PrinterImin.printText(`${dash}`);
      if (order.user.name)
        await PrinterImin.printText(`Customer: ${order.user.name}`);
      if (order.user.phone)
        await PrinterImin.printText(`Phone: ${order.user.phone}`);
      if (address) await PrinterImin.printText(`Address: ${address}`);
    }

    // Submitted time / date
    if (createdAt) {
      await PrinterImin.printText(`Submitted: ${createdAt}\n`);
    }

    await PrinterImin.printQrCode("https://www.gbcanteen.com/", {
      align: IminPrintAlign.center,
      errorCorrectionLevel: IminQrcodeCorrectionLevel.levelQ,
      qrSize: 4,
    });
    await PrinterImin.printAndFeedPaper(20);

    await PrinterImin.printAndFeedPaper(40);
  } catch (e) {
    console.error("printCompactReceipt58 error:", e);
  }
}

// import { Alert, Platform } from "react-native";
// import PrinterSDK, {
//   IminPrintAlign,
//   IminFontStyle,
// } from "react-native-printer-imin";
// import { Order } from "./types";
// import { Asset } from "expo-asset";
// import * as FileSystem from "expo-file-system";

// export const printOrder = async (
//   order: Order,
//   sdkVersion: "v2" | "v1"
// ): Promise<void> => {
//   if (Platform.OS !== "android") {
//     Alert.alert("Unavailable", "Printing only works on Android.");
//     return;
//   }

//   try {
//     await PrinterSDK.initPrinter();

//     const total = (order.amount / 100).toFixed(2);
//     const createdAt = new Date(order.createdAt).toLocaleString("en-GB");
//     const estimatedTime = new Date(
//       new Date(order.createdAt).getTime() + 45 * 60000
//     ).toLocaleTimeString("en-GB", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     const totalItems =
//       order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
//     const address =
//       order.user.address || order.user.googleAddress || "No address provided";

//     const printCopy = async (label: string, showCustomer: boolean) => {
//       await PrinterSDK.setAlignment(IminPrintAlign.center);

//       const asset = Asset.fromModule(
//         require("../assets/images/black-logo.png")
//       );
//       await asset.downloadAsync();
//       await new Promise((res) => setTimeout(res, 300));
//       const logoPath = asset.localUri ?? asset.uri;
//       const fileExists = await FileSystem.getInfoAsync(logoPath);

//       if (fileExists.exists && logoPath.startsWith("file://")) {
//         await PrinterSDK.printSingleBitmap(logoPath, {
//           align: IminPrintAlign.center,
//           width: 380,
//         });
//       } else {
//         console.warn("Logo not found at:", logoPath);
//       }

//       await PrinterSDK.printText(`G.B.C.`, {
//         fontStyle: IminFontStyle.bold,
//         fontSize: 12,
//         align: IminPrintAlign.center,
//       });

//       await PrinterSDK.printText(`=== ${label} ===`, {
//         fontStyle: IminFontStyle.bold,
//         fontSize: 2,
//         align: IminPrintAlign.center,
//       });

//       await PrinterSDK.printText(
//         `${order.restaurant?.name || "G.B.C. Restaurant"}`
//       );
//       await PrinterSDK.printText(`Est. Delivery: ${estimatedTime}`);
//       await PrinterSDK.printText("------------------------------");

//       if (sdkVersion === "v1") {
//         await PrinterSDK.setTextSize(3);
//         await PrinterSDK.setTextStyle(IminFontStyle.bold);
//         await PrinterSDK.printText(`#${order.orderNumber.split("-")[1]}`);
//         await PrinterSDK.setTextSize(1);
//         await PrinterSDK.setTextStyle(IminFontStyle.normal);
//       } else {
//         await PrinterSDK.printText(`#${order.orderNumber.split("-")[1]}`, {
//           fontSize: 15,
//           fontStyle: IminFontStyle.bold,
//           align: IminPrintAlign.center,
//         });
//       }

//       await PrinterSDK.printText(`Payment ID: ${order.stripeId}`);

//       if (order.orderNote) {
//         await PrinterSDK.printText(`Note: ${order.orderNote.slice(0, 100)}`);
//       }

//       await PrinterSDK.printText("------------------------------");
//       await PrinterSDK.printText("Order", {
//         fontStyle: IminFontStyle.bold,
//       });
//       await PrinterSDK.printText("------------------------------");

//       for (const item of order.items || []) {
//         const qty = item.quantity || 1;
//         const name = item.title || "Item";
//         const price = item.price;

//         if (label === "KITCHEN COPY") {
//           await PrinterSDK.printText(`${qty}x ${name} GBP${price}`, {
//             fontSize: 15,
//             fontStyle: IminFontStyle.bold,
//           });
//         } else {
//           await PrinterSDK.printText(`${qty}x ${name} GBP${price}`);
//         }
//       }

//       await PrinterSDK.printText("------------------------------");
//       await PrinterSDK.printText(`No of items: ${totalItems}`);
//       await PrinterSDK.printText(`Total: £${total}`);
//       await PrinterSDK.printText("------------------------------");

//       if (showCustomer) {
//         await PrinterSDK.printText(`Customer: ${order.user.name}`);
//         await PrinterSDK.printText(`Phone: ${order.user.phone}`);
//         await PrinterSDK.printText(`Address: ${address}`);

//         await PrinterSDK.printQrCode("https://www.gbcanteen.com/", {
//           align: IminPrintAlign.center,
//           qrSize: 6,
//         });
//         await PrinterSDK.printText(`\n`);
//       }

//       await PrinterSDK.printText(`Date: ${createdAt}`);

//       if (showCustomer) {
//         await PrinterSDK.printText("------------------------------");
//         await PrinterSDK.setAlignment(IminPrintAlign.center);
//         await PrinterSDK.printText("Thank you for your order!");
//         await PrinterSDK.printText(`\n`);
//       }
//     };

//     await printCopy("KITCHEN COPY", false);
//     await PrinterSDK.partialCut();

//     await printCopy("CUSTOMER COPY", true);
//     await PrinterSDK.fullCut();
//   } catch (error: unknown) {
//     const errMsg = error instanceof Error ? error.message : "Unknown error.";
//     Alert.alert("Printing failed!", errMsg);
//   }
// };

// import { Alert, Platform } from "react-native";
// import PrinterSDK, {
//   IminPrintAlign,
//   IminFontStyle,
// } from "react-native-printer-imin";
// import { Order } from "./types";
// import { Asset } from "expo-asset";
// import * as FileSystem from "expo-file-system";

// export const printOrder = async (
//   order: Order,
//   sdkVersion: "v2"
// ): Promise<void> => {
//   if (Platform.OS !== "android") {
//     Alert.alert("Unavailable", "Printing only works on Android.");
//     return;
//   }

//   try {
//     await PrinterSDK.initPrinter();

//     const total = (order.amount / 100).toFixed(2);
//     const createdAt = new Date(order.createdAt).toLocaleString("en-GB");
//     const estimatedTime = new Date(
//       new Date(order.createdAt).getTime() + 45 * 60000
//     ).toLocaleTimeString("en-GB", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     const totalItems =
//       order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
//     const address =
//       order.user.address || order.user.googleAddress || "No address provided";

//     const printCopy = async (label: string, showCustomer: boolean) => {
//       const asset = Asset.fromModule(
//         require("../assets/images/black-logo.png")
//       );
//       await asset.downloadAsync();
//       const logoPath = asset.localUri ?? asset.uri;
//       const fileExists = await FileSystem.getInfoAsync(logoPath);

//       if (fileExists.exists && logoPath.startsWith("file://")) {
//         await PrinterSDK.printSingleBitmap(logoPath, {
//           align: IminPrintAlign.center,
//           width: 380,
//         });
//       } else {
//         console.warn("Logo not found at:", logoPath);
//       }

//       await PrinterSDK.printText(`G.B.C.`, {
//         fontStyle: IminFontStyle.bold,
//         fontSize: 12,
//         align: IminPrintAlign.center,
//       });

//       await PrinterSDK.printText(`=== ${label} ===`, {
//         fontStyle: IminFontStyle.bold,
//         fontSize: 2,
//         align: IminPrintAlign.center,
//       });

//       await PrinterSDK.printText(`${order.restaurant?.name || "Restaurant"}`);
//       await PrinterSDK.printText(`Est. Delivery: ${estimatedTime}`);
//       await PrinterSDK.printText("------------------------------");

//       await PrinterSDK.printText(`#${order.orderNumber.split("-")[1]}`, {
//         fontSize: 15,
//         fontStyle: IminFontStyle.bold,
//         align: IminPrintAlign.center,
//       });

//       await PrinterSDK.printText(`Payment ID: ${order.stripeId}`);

//       if (order.orderNote) {
//         await PrinterSDK.printText(`Note: ${order.orderNote.slice(0, 100)}`);
//       }

//       await PrinterSDK.printText("------------------------------");
//       await PrinterSDK.printText("Order", {
//         fontStyle: IminFontStyle.bold,
//       });
//       await PrinterSDK.printText("------------------------------");

//       for (const item of order.items || []) {
//         const qty = item.quantity || 1;
//         const name = item.title || "Item";
//         const price = item.price;

//         const itemText = `${qty}x ${name} GBP${price}`;
//         await PrinterSDK.printText(itemText, {
//           fontSize: 15,
//           fontStyle:
//             label === "KITCHEN COPY"
//               ? IminFontStyle.bold
//               : IminFontStyle.normal,
//         });
//       }

//       await PrinterSDK.printText("------------------------------");
//       await PrinterSDK.printText(`No of items: ${totalItems}`);
//       await PrinterSDK.printText(`Total: £${total}`);
//       await PrinterSDK.printText("------------------------------");

//       if (showCustomer) {
//         await PrinterSDK.printText(`Customer: ${order.user.name}`);
//         await PrinterSDK.printText(`Phone: ${order.user.phone}`);
//         await PrinterSDK.printText(`Address: ${address}`);

//         await PrinterSDK.printQrCode("https://www.gbcanteen.com/", {
//           align: IminPrintAlign.center,
//           qrSize: 6,
//         });
//         await PrinterSDK.printText(`\n`);
//       }

//       await PrinterSDK.printText(`Date: ${createdAt}`);

//       if (showCustomer) {
//         await PrinterSDK.printText("------------------------------");
//         await PrinterSDK.printText("Thank you for your order!", {
//           align: IminPrintAlign.center,
//         });
//         await PrinterSDK.printText(`\n`);
//       }
//     };

//     await printCopy("KITCHEN COPY", false);
//     await PrinterSDK.partialCut();

//     await printCopy("CUSTOMER COPY", true);
//     await PrinterSDK.fullCut();
//   } catch (error: unknown) {
//     const errMsg = error instanceof Error ? error.message : "Unknown error.";
//     Alert.alert("Printing failed!", errMsg);
//   }
// };
