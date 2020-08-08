import * as shopify from 'shopify-api-node';


export const connectToShopify = (shopifyConfig: any) => new shopify({
  shopName: shopifyConfig.shop_name,
  apiKey: shopifyConfig.api_key,
  password: shopifyConfig.password
});
