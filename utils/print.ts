import { Alert, Platform } from "react-native";
import PrinterSDK, {
  IminPrintAlign,
  IminFontStyle,
} from "react-native-printer-imin";
import { Order } from "./types";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

export const printOrder = async (
  order: Order,
  sdkVersion: "v1" | "v2"
): Promise<void> => {
  if (Platform.OS !== "android") {
    Alert.alert("Unavailable", "Printing only works on Android.");
    return;
  }

  try {
    await PrinterSDK.initPrinter();

    const total = (order.amount / 100).toFixed(2);
    const createdAt = new Date(order.createdAt).toLocaleString("en-GB");
    const estimatedTime = new Date(
      new Date(order.createdAt).getTime() + 45 * 60000
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const totalItems =
      order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const address =
      order.user.address || order.user.googleAddress || "No address provided";

    const printCopy = async (label: string, showCustomer: boolean) => {
      await PrinterSDK.setAlignment(IminPrintAlign.center);

      const asset = Asset.fromModule(
        require("../assets/images/black-logo.png")
      );
      await asset.downloadAsync();
      await new Promise((res) => setTimeout(res, 300));
      const logoPath = asset.localUri ?? asset.uri;
      const fileExists = await FileSystem.getInfoAsync(logoPath);

      if (fileExists.exists && logoPath.startsWith("file://")) {
        await PrinterSDK.printSingleBitmap(logoPath, {
          align: IminPrintAlign.center,
          width: 380,
        });
      } else {
        console.warn("Logo not found at:", logoPath);
      }

      await PrinterSDK.printText(`G.B.C.`, {
        fontStyle: IminFontStyle.bold,
        fontSize: 12,
        align: IminPrintAlign.center,
      });

      await PrinterSDK.printText(`=== ${label} ===`, {
        fontStyle: IminFontStyle.bold,
        fontSize: 2,
        align: IminPrintAlign.center,
      });

      await PrinterSDK.printText(`${order.restaurant?.name || "Restaurant"}`);
      await PrinterSDK.printText(`Est. Delivery: ${estimatedTime}`);
      await PrinterSDK.printText("------------------------------");

      if (sdkVersion === "v1") {
        await PrinterSDK.setTextSize(3);
        await PrinterSDK.setTextStyle(IminFontStyle.bold);
        await PrinterSDK.printText(`#${order.orderNumber.split("-")[1]}`);
        await PrinterSDK.setTextSize(1);
        await PrinterSDK.setTextStyle(IminFontStyle.normal);
      } else {
        await PrinterSDK.printText(`#${order.orderNumber.split("-")[1]}`, {
          fontSize: 15,
          fontStyle: IminFontStyle.bold,
          align: IminPrintAlign.center,
        });
      }

      await PrinterSDK.printText(`Payment ID: ${order.stripeId}`);

      if (order.orderNote) {
        await PrinterSDK.printText(`Note: ${order.orderNote.slice(0, 100)}`);
      }

      await PrinterSDK.printText("------------------------------");
      await PrinterSDK.printText("Order", {
        fontStyle: IminFontStyle.bold,
      });
      await PrinterSDK.printText("------------------------------");

      for (const item of order.items || []) {
        const qty = item.quantity || 1;
        const name = item.title || "Item";
        const price = item.price;

        if (label === "KITCHEN COPY") {
          await PrinterSDK.printText(`${qty}x ${name} GBP${price}`, {
            fontSize: 15,
            fontStyle: IminFontStyle.bold,
          });
        } else {
          await PrinterSDK.printText(`${qty}x ${name} GBP${price}`);
        }
      }

      await PrinterSDK.printText("------------------------------");
      await PrinterSDK.printText(`No of items: ${totalItems}`);
      await PrinterSDK.printText(`Total: £${total}`);
      await PrinterSDK.printText("------------------------------");

      if (showCustomer) {
        await PrinterSDK.printText(`Customer: ${order.user.name}`);
        await PrinterSDK.printText(`Phone: ${order.user.phone}`);
        await PrinterSDK.printText(`Address: ${address}`);

        await PrinterSDK.printQrCode("https://www.gbcanteen.com/", {
          align: IminPrintAlign.center,
          qrSize: 6,
        });
        await PrinterSDK.printText(`\n`);
      }

      await PrinterSDK.printText(`Date: ${createdAt}`);

      if (showCustomer) {
        await PrinterSDK.printText("------------------------------");
        await PrinterSDK.setAlignment(IminPrintAlign.center);
        await PrinterSDK.printText("Thank you for your order!");
        await PrinterSDK.printText(`\n`);
      }
    };

    await printCopy("KITCHEN COPY", false);
    await PrinterSDK.partialCut();

    await printCopy("CUSTOMER COPY", true);
    await PrinterSDK.fullCut();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error.";
    Alert.alert("Printing failed!", errMsg);
  }
};

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
