import { StormGlass } from "@src/clients/stormGlass";
import * as HTTPUtil from '@src/util/request'
import stormGlassWeather3Hours from "@test/fixtures/stormglass_weather_3_hours.json";
import stormGlassNormalizedResponse3Hours from "@test/fixtures/stormglass_normalized_response_3_hours.json";

jest.mock("@src/util/request");

describe("StormGlass client", () => {
  const mockedRequestClass = HTTPUtil.Request as jest.Mocked<typeof HTTPUtil.Request> 
  const mockedRequest = new HTTPUtil.Request() as jest.Mocked<HTTPUtil.Request>;
  it("should get a generic error from StormGlass service when the request fail before reaching the service", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedRequest.get.mockResolvedValue({ data: stormGlassWeather3Hours } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequest);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual(stormGlassNormalizedResponse3Hours);
  });

  it("should exclude incomplete data points", async () => {
    const lat = -33.792726;
    const lng = 151.289824;
    const incomplete_response = {
      hours: [
        {
          "swellDirection": {
            "noaa": 64.26
          }
        }
      ]
    }
    mockedRequest.get.mockResolvedValue({ data: incomplete_response } as HTTPUtil.Response);

    const stormGlass =  new StormGlass(mockedRequest);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual([]);
  });

  it("exception 1", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedRequest.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass =  new StormGlass(mockedRequest);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Network Error'
    )
  });

  it("exception 2", async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    class FakeAxiosError extends Error {
      constructor(public response: object) {
        super();
      }
    }

    mockedRequestClass.isRequestError.mockReturnValue(true);
    mockedRequestClass.extractErrorData.mockReturnValue({
      status: 429,
      data: { errors: ['Rate Limit reached'] },
    });

    mockedRequest.get.mockRejectedValue(
      new FakeAxiosError ({
        status: 429,
        data: { errors: ['Rate Limit reached'] },
      })
    );

    const stormGlass =  new StormGlass(mockedRequest);
    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error returned by the StormGlass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
    )
  });
});
