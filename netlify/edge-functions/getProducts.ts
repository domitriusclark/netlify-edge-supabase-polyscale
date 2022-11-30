// Below this fold are our URL imports. You can read more about that here https://deno.land/manual@v1.0.0/linking_to_external_code
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

import type { Context } from "https://edge.netlify.com/";
import type { QueryObjectResult } from "https://deno.land/x/postgres@v0.17.0/query.ts";

export default async (_request: Request, context: Context) => {
  try {
    /* 
	1. 
	Here we create and connect to our Supabase DB through 
        PolyScale's URI from our env variables
     */

    const config = Deno.env.get("POLYSCALE_SUPABASE_URL");
    const client = new Client(config);
    await client.connect();

    /* 
	2. 
	context.next() grabs the next HTTP response in the chain so 
        we can intercept and modify it. Learn more about modifying 
        responses at https://docs.netlify.com/edge- 
        functions/api/#modify-a-response
     */

    const response = await context.next();
    const products = await client.queryObject("SELECT * FROM products");

    /* 
         3. 
         We create some html based on the products coming from the 
         DB so we can drop it into our rewrite function below
     */
    const productsHTML = products.rows.map(
      (product: QueryObjectResult<unknown>) => {
        return `<p>${product.name}</p>`;
      }
    );

    /*
         4. 
         Now we're going to find and replace an element using 
         HTMLRewriter with the HTML we created above. 
      */

    return new HTMLRewriter()
      .on("span#products", {
        element(element) {
          element.replace(productsHTML.join(""), {
            html: true,
          });
        },
      })
      .transform(response);
  } catch (error) {
    console.log(error);
    return;
  }
};
