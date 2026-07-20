# Backyard Pizza — setup & weekly use

A tiny reservation site for a one-person, one-pizza-a-week backyard operation.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The public page. Neighbors see the pizza day + price and reserve with just a name. |
| `admin.html` | Your private dashboard (password-protected). Set the week's pizza, see who reserved, cancel spots. |
| `firestore.rules` | Security rules that lock the data down. **Must be published** (see below). |
| `firebase.json` | Lets you deploy the rules from the command line. |
| `backyard.jpg`, `pizza-pattern.jpg` | Site images. |

---

## One-time setup (about 10 minutes)

The admin page is protected by a single login (yours). Set it up in the
[Firebase Console](https://console.firebase.google.com/) for the
`backyard-pizza` project.

**Do these in order.** Set up your login *before* publishing the rules, or you
won't be able to get into the admin page afterward.

### 1. Turn on email/password login
Authentication → **Sign-in method** → **Email/Password** → **Enable** → Save.

### 2. Create your admin account
Authentication → **Users** → **Add user** → enter your email + a password.
That email/password is what you'll type on `admin.html`.

### 3. Publish the security rules
Either paste them in the console, or use the CLI.

**Console:** Firestore Database → **Rules** → paste the contents of
`firestore.rules` → **Publish**.

**CLI** (if you have the Firebase CLI installed):
```
firebase deploy --only firestore:rules
```

Once published:
- The public can read the pizza day and reserve — nothing else.
- Only you (signed in) can view the reservation list, cancel spots, or change settings.

---

## Each week

1. Open `admin.html` and log in.
2. Set the **date**, **menu** (the one pizza you're making), **price**, and
   optionally serving hours / total pizzas.
3. Click **Save Settings**. If you changed the date, it asks to confirm and
   then **clears last week's reservations automatically** — fresh slate.

That's it. Neighbors reserve on the main page; watch them come in on the admin
dashboard (hit **Refresh**).

## Cancellations

There's no self-serve cancel link — customers just **text you** to cancel.
Find their row in the admin table and click **Cancel**; that frees the slot(s)
back up.

---

## Good to know

- **The reservation counter is the one thing not fully locked.** Because
  reservations happen entirely in the browser with no server, the
  "reserved" count has to stay publicly writable. Someone could in theory
  nudge it. It's a fine trade-off for a backyard thing; fully closing it would
  mean adding a Firebase Cloud Function. See the comment at the top of
  `firestore.rules`.
- **The Firebase API key in the HTML is not a secret** — that's normal for
  Firebase web apps. Your data is protected by the rules above, not by hiding
  the key.

## Liability — worth a quick check (not legal advice)

You're charging for perishable, home-cooked food, so before you get going:

- **Cottage food / home-kitchen rules vary by state and county.** Basic
  cottage-food laws often *don't* cover hot perishable food like pizza; some
  states have a separate home-kitchen ("MEHKO") permit that does. Check your
  **state's rules and your county health department** — this is the big one.
- **Insurance:** homeowner's/renter's policies often exclude business activity.
  A quick call to your insurer is worth it, since people are coming to your yard.
- **Allergens:** the site already shows a "made in a home kitchen, handles
  wheat/dairy/etc." disclaimer. Keep your ingredient info honest.
