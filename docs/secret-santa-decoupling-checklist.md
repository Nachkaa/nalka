# Secret Santa Decoupling Manual Checklist

Assumptions used in this refactor:

- Event -> modules relation is `event.modules`.
- Event -> memberships relation is `event.memberships`.
- Event module unique key lookup is `eventId_key`.

1. Enable `SECRET_SANTA` only:

- Secret Santa module tab is visible.
- Gifts module tab is not visible unless `GIFTS` module is enabled.
- No gift lists are auto-created.

2. Enable `GIFTS` only:

- Gifts tab is visible.
- Secret Santa tab is not visible unless `SECRET_SANTA` module is enabled.

3. Enable both:

- Gifts and Secret Santa tabs are both visible.
- Gifts behavior and Secret Santa draw behavior are independent.

4. Accept invite into Secret Santa-only event:

- User joins successfully.
- No personal gift list is created on join.

5. Add relative:

- Relative is added successfully.
- Gift list sync only happens when `GIFTS` is enabled and `giftMode === PERSONAL_LISTS`.
