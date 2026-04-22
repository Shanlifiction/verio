import { Session } from "../../src/sessions.ts";

declare global {
    namespace Express {
        interface Request {
            session: Session;
        }
    }
}
