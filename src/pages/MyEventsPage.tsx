const isHost = async (event: EventType) => {
  const user = await UserService.getUserByWhatsApp(whatsappNumber);
  if (!user) return false;
  return user.id === event.host_user_id;
};
