import { Screen } from '../../components/Screen';
import { smsHref, whatsappHref } from '../../domain/messages';
import { decodeGuestPayload } from '../../domain/payload';
import { formatDay } from '../../lib/format';
import { GuestFooter, PartyFacts } from './GuestDetails';

/** An offline guest link: everything is in the URL, and replies go by text message. */
export function InvitePage({ payload }: { payload: string }) {
  const p = decodeGuestPayload(payload);
  if (!p) {
    return (
      <main class="app">
        <Screen title="Can't open this link">
          <p>The link looks cut off. Ask the host to send it again.</p>
          <GuestFooter />
        </Screen>
      </main>
    );
  }
  const { info, guest } = p;
  const reply = (word: string) =>
    `Hi ${info.hostName}, it's ${guest.name}: ${word} for ${info.name}!`;
  return (
    <main class="app">
      <Screen
        title={info.name}
        docTitle={info.name}
        kicker={<span class="brand">Hi {guest.name}!</span>}
      >
        <PartyFacts info={info} guest={guest} url={location.href} />
        <section class="card stack-sm" aria-labelledby="reply">
          <h2 id="reply" class="card__title">
            Let {info.hostName} know
          </h2>
          <div class="button-grid">
            <a class="btn" href={smsHref(guest.hostPhone, reply("I'm coming"))}>
              Text: I'm coming
            </a>
            <a
              class="btn btn--ghost"
              href={smsHref(guest.hostPhone, reply("sorry, I can't make it"))}
            >
              Text: can't come
            </a>
            <a
              class="btn btn--ghost"
              href={whatsappHref(guest.hostPhone, reply("I'm coming"))}
              target="_blank"
              rel="noopener"
            >
              WhatsApp
            </a>
          </div>
        </section>
        <p class="hint">Details as of {formatDay(p.updatedAt.slice(0, 16))}.</p>
        <GuestFooter />
      </Screen>
    </main>
  );
}
