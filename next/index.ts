import type {
  NextApiHandler,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { IronSessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import getPropertyDescriptorForReqSession from "../src/getPropertyDescriptorForReqSession";
import { IncomingMessage, ServerResponse } from "http";

// Argument types based on getIronSession function
type GetIronSessionApiOptions = (
  request: NextApiRequest,
  response: NextApiResponse,
) => Promise<IronSessionOptions> | IronSessionOptions;

export function withIronSessionApiRoute(
  handler: NextApiHandler,
  options: IronSessionOptions | GetIronSessionApiOptions,
): NextApiHandler {
  return async function nextApiHandlerWrappedWithIronSession(req, res) {
    // If options is a function, call it and assign the results back.
    if (options instanceof Function) {
      options = await options(req, res);
    }
    const session = await getIronSession(req, res, options);

    // we define req.session as being enumerable (so console.log(req) shows it)
    // and we also want to allow people to do:
    // req.session = { admin: true }; or req.session = {...req.session, admin: true};
    // req.session.save();
    Object.defineProperty(
      req,
      "session",
      getPropertyDescriptorForReqSession(session),
    );
    return handler(req, res);
  };
}

type GetIronSessionSSROptions = (
  request: IncomingMessage,
  response: ServerResponse,
) => Promise<IronSessionOptions> | IronSessionOptions;

export function withIronSessionSsr<
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler: (
    context: GetServerSidePropsContext,
  ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
  options: IronSessionOptions | GetIronSessionSSROptions,
) {
  return async function nextGetServerSidePropsHandlerWrappedWithIronSession(
    context: GetServerSidePropsContext,
  ) {
    // If options is a function, call it and assign the results back.
    if (options instanceof Function) {
      options = await options(context.req, context.res);
    }
    const session = await getIronSession(context.req, context.res, options);
    Object.defineProperty(
      context.req,
      "session",
      getPropertyDescriptorForReqSession(session),
    );
    return handler(context);
  };
}
