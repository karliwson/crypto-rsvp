/* eslint-disable no-undef */

var CryptoRSVP = artifacts.require("./CryptoRSVP.sol");

contract("CryptoRSVP", function(accounts) {
    const USER_PROFILE_NAME = 'John Doe';
    const USER_PROFILE_AVATAR_URL = 'https://ipfs.io/ipfs/dafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m';

    const EVENT_INFO = {
        name: 'Test Event',
        seats: 10,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 1000,
    };

  beforeEach(async () => {
    _instance = await CryptoRSVP.new();
  });

  describe('user', () => {
      it("updates his profile", async () => {

        await _instance.updateUserProfile(USER_PROFILE_NAME, USER_PROFILE_AVATAR_URL, { from: accounts[0] });
        const profile = await _instance.users(accounts[0]);
    
        assert(USER_PROFILE_NAME === profile.name);
        assert(USER_PROFILE_AVATAR_URL === profile.avatarUrl);
      });

      it("creates an event", async () => {
    
          // Create user profile for accounts[0]
          await _instance.updateUserProfile(USER_PROFILE_NAME, USER_PROFILE_AVATAR_URL, { from: accounts[0] });
          // Create the event
          const result = await _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[0] });
          const createdEvent = result?.logs?.[0].args?._event;
    
          assert(createdEvent, 'EventCreated event not returned from transaction');
          Object.keys(EVENT_INFO).forEach(p => {
              expect(createdEvent).to.have.property(p, createdEvent[p]);
          });
    
          expect(createdEvent.participants?.length).to.be.equal(1);
          expect(createdEvent.participants[0].userAddress).to.be.equal(accounts[0]);
          expect(createdEvent.participants[0].attended).to.be.equal(true);
      });

      it("registers to an event", async () => {
    
            // Update profiles for accounts 0 and 1
            await Promise.all([0, 1].map(i =>
                _instance.updateUserProfile(`${USER_PROFILE_NAME} ${i}`, USER_PROFILE_AVATAR_URL, { from: accounts[i] })));
    
            // Create event from account 0
            let tx = await _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[0] });
            const eventId = parseInt(tx?.logs?.[0].args?._event?.id);
            assert(![undefined, null, NaN].includes(eventId));
    
            // Register to event from account 1
            await _instance.registerToEvent(eventId, { from: accounts[1] });
    
            // Gets user events
            let eventIds = await _instance.getEvents.call({ from: accounts[1] });
            eventIds = eventIds.map(e => e.words[0]);
    
            expect(eventIds.length).to.be.equal(1);
            expect(eventIds[0]).to.be.equal(eventId);

            // TODO: validate user balance after staking
      });

      it("gets the events he owns or is registered in", async () => {
    
            // Update profiles for accounts 0, 1 and 2
            await Promise.all([0, 1, 2].map(i =>
                _instance.updateUserProfile(`${USER_PROFILE_NAME} ${i}`, USER_PROFILE_AVATAR_URL, { from: accounts[i] })));
    
            // Create some events from different accounts
            const [,,, tx] = await Promise.all([0, 0, 1, 2].map(i =>
                _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[i] })));
    
            // Get account2's event id
            const eventId = parseInt(tx?.logs?.[0].args?._event?.id);
            assert(![undefined, null, NaN].includes(eventId));
    
            // Make accounts 0 and 1 join the event owned by account 2
            await Promise.all([0, 1].map(i =>
                _instance.registerToEvent(eventId, { from: accounts[i] })));
    
            // Gets the events for accounts 1 and 2
    
            const results = await Promise.all([0, 1].map(i => _instance.getEvents.call({ from: accounts[i] })));
            let eventIds = results.map(a => a.map(e => e.words[0]));
    
            const [events0, events1] = await Promise.all([
                Promise.all(eventIds[0].map(id => _instance.events.call(id, { from: accounts[0] }))),
                Promise.all(eventIds[1].map(id => _instance.events.call(id, { from: accounts[1] })))
            ]);
    
            expect(events0.length).to.be.equal(3);
            expect(events0[0].owner).to.be.equal(accounts[0]);
            expect(events0[1].owner).to.be.equal(accounts[0]);
            expect(events0[2].owner).to.be.equal(accounts[2]);
    
            expect(events1.length).to.be.equal(2);
            expect(events1[0].owner).to.be.equal(accounts[1]);
            expect(events1[1].owner).to.be.equal(accounts[2]);
      });
  });

  describe('event owner', () => {

    it("checks-in an event participant", async () => {

        // Update profiles for accounts 0 and 1
        await Promise.all([0, 1].map(i =>
            _instance.updateUserProfile(`${USER_PROFILE_NAME} ${i}`, USER_PROFILE_AVATAR_URL, { from: accounts[i] })));

        // Create event from account 0 (event owner)
        let tx = await _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[0] });
        const eventId = parseInt(tx?.logs?.[0].args?._event?.id);
        assert(![undefined, null, NaN].includes(eventId));

        // Register to the event from account 1
        await _instance.registerToEvent(eventId, { from: accounts[1] });

        // Check-in user
        await _instance.checkInEventParticipant(eventId, accounts[1], { from: accounts[0] });

        // Get event participants and check if the user is marked as attended
        const participants = await _instance.getEventParticipants.call(eventId, { from: accounts[0] });

        expect(participants.length).to.be.equal(2);
        expect(participants[1].userAddress).to.be.equal(accounts[1]);
        expect(participants[1].attended).to.be.equal(true);

        // TODO: check user balance...
    });

    it("closes the event", async () => {
        // Update profiles for accounts 0, 1, 2, 3 and 4
        await Promise.all([0, 1, 2, 3, 4].map(i =>
            _instance.updateUserProfile(`${USER_PROFILE_NAME} ${i}`, USER_PROFILE_AVATAR_URL, { from: accounts[i] })));

        // Create event from account 0 (event owner)
        let tx = await _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[0] });
        const eventId = parseInt(tx?.logs?.[0].args?._event?.id);
        assert(![undefined, null, NaN].includes(eventId));

        // Register to the event from accounts 1, 2, 3 and 4
        await Promise.all([1, 2, 3, 4].map(i =>
            _instance.registerToEvent(eventId, { from: accounts[i] })));

        // Check-in users 1 and 2 (users 3 and 4 will miss the event)
        await Promise.all([1, 2].map(i =>
            _instance.checkInEventParticipant(eventId, accounts[i], { from: accounts[0] })));

        // Close the event
        await _instance.closeEvent(eventId, { from: accounts[0] });

        const event = await _instance.events.call(eventId, { from: accounts[0] });
        
        expect(Number(event.status)).to.be.equal(1 /* Closed */);

        // TODO: check user balances...
    });

    it("cancels the event", async () => {
        // Update profiles for accounts 0, 1, 2, 3 and 4
        await Promise.all([0, 1, 2, 3, 4].map(i =>
            _instance.updateUserProfile(`${USER_PROFILE_NAME} ${i}`, USER_PROFILE_AVATAR_URL, { from: accounts[i] })));

        // Create event from account 0 (event owner)
        let tx = await _instance.createEvent(...Object.values(EVENT_INFO), { from: accounts[0] });
        const eventId = parseInt(tx?.logs?.[0].args?._event?.id);
        assert(![undefined, null, NaN].includes(eventId));

        // Register to the event from accounts 1, 2, 3 and 4
        await Promise.all([1, 2, 3, 4].map(i =>
            _instance.registerToEvent(eventId, { from: accounts[i] })));

        // Check-in users 1 and 2 (users 3 and 4 will miss the event)
        await Promise.all([1, 2].map(i =>
            _instance.checkInEventParticipant(eventId, accounts[i], { from: accounts[0] })));

        // Close the event
        await _instance.cancelEvent(eventId, { from: accounts[0] });

        const event = await _instance.events.call(eventId, { from: accounts[0] });
        
        expect(Number(event.status)).to.be.equal(2 /* Cancelled */);

        // TODO: check user balances...
    });
  });

});
