export default `use RoadRunner\\Centrifugo\\CentrifugoApiInterface;

final class UserBanService
{
    public function __construct(
        private readonly UserRepository $repository,
        private readonly CentrifugoApiInterface $ws
    ) {}

    public function handle(string $userUuid): void
    {
        $user = $this->repository->findByPK($userUuid);

        // Ban user...

        // Disconnect from webscoket server
        $this->ws->disconnect($user->getId());
    }
}
`
