import { CheckApiHealthUseCase } from "../use-cases/check-api-health.usecase";
import { HttpApiHealthAdapter } from "../infrastructure/http/http-api-health.adapter";
import { AnonymizeTextUseCase } from "../use-cases/anonymize-text.usecase";
import { SendChatMessageUseCase } from "../use-cases/send-chat-message.usecase";
import { HttpChatGatewayAdapter } from "../infrastructure/http/http-chat-gateway.adapter";
import { RequestHumanHandoffUseCase } from "../use-cases/request-human-handoff.usecase";
import { ScoreAssessmentUseCase } from "../use-cases/score-assessment.usecase";
import { EncryptAssessmentUseCase } from "../use-cases/encrypt-assessment.usecase";
import { SubmitAssessmentUseCase } from "../use-cases/submit-assessment.usecase";
import { WebCryptoEncryptionAdapter } from "../infrastructure/crypto/web-crypto-encryption.adapter";
import { IndexedDbAssessmentStoreAdapter } from "../infrastructure/storage/indexeddb-assessment-store.adapter";
import { HttpAssessmentSubmissionAdapter } from "../infrastructure/http/http-assessment-submission.adapter";

export const checkApiHealthUseCase = new CheckApiHealthUseCase(new HttpApiHealthAdapter());
export const sendChatMessageUseCase = new SendChatMessageUseCase(
  new HttpChatGatewayAdapter(),
  new AnonymizeTextUseCase(),
);
export const requestHumanHandoffUseCase = new RequestHumanHandoffUseCase();
export const submitAssessmentUseCase = new SubmitAssessmentUseCase(
  new ScoreAssessmentUseCase(),
  new EncryptAssessmentUseCase(new WebCryptoEncryptionAdapter()),
  new IndexedDbAssessmentStoreAdapter(),
  new HttpAssessmentSubmissionAdapter(),
);
