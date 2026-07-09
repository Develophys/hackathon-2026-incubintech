import { CheckApiHealthUseCase } from "../use-cases/check-api-health.usecase";
import { HttpApiHealthAdapter } from "../infrastructure/http/http-api-health.adapter";
import { AnonymizeTextUseCase } from "../use-cases/anonymize-text.usecase";
import { SendChatMessageUseCase } from "../use-cases/send-chat-message.usecase";
import { HttpChatGatewayAdapter } from "../infrastructure/http/http-chat-gateway.adapter";
import { RequestHumanHandoffUseCase } from "../use-cases/request-human-handoff.usecase";

export const checkApiHealthUseCase = new CheckApiHealthUseCase(new HttpApiHealthAdapter());
export const sendChatMessageUseCase = new SendChatMessageUseCase(
  new HttpChatGatewayAdapter(),
  new AnonymizeTextUseCase(),
);
export const requestHumanHandoffUseCase = new RequestHumanHandoffUseCase();
